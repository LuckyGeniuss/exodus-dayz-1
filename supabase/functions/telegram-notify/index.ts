import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: string;
}

async function getAdminSetting(supabaseUrl: string, supabaseKey: string, key: string): Promise<string | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (error || !data) return null;
  return (data as { value: string | null }).value;
}

async function sendTelegramMessage(botToken: string, message: TelegramMessage): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...message,
        parse_mode: message.parse_mode || 'HTML'
      })
    });
    
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Telegram API error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { type, data } = await req.json();

    // Get Telegram bot token and chat ID from admin settings
    const botToken = await getAdminSetting(supabaseUrl, supabaseServiceKey, 'TELEGRAM_BOT_TOKEN');
    const chatId = await getAdminSetting(supabaseUrl, supabaseServiceKey, 'TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      console.log('Telegram not configured, skipping notification');
      return new Response(
        JSON.stringify({ success: false, message: 'Telegram not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let text = '';

    switch (type) {
      case 'new_order':
        const { order_id, user_email, total_amount, payment_method, items } = data;
        const itemsList = items
          .map((item: { product_name: string; quantity: number; product_price: number }) => 
            `  • ${item.product_name} x${item.quantity} — ${item.product_price * item.quantity} ₴`)
          .join('\n');
        
        text = `🛒 <b>Нове замовлення!</b>\n\n` +
          `📋 ID: <code>${order_id.slice(0, 8)}</code>\n` +
          `👤 Покупець: ${user_email}\n` +
          `💰 Сума: <b>${total_amount} ₴</b>\n` +
          `💳 Оплата: ${payment_method}\n\n` +
          `📦 Товари:\n${itemsList}`;
        break;

      case 'order_status':
        const statusEmoji: Record<string, string> = {
          completed: '✅',
          pending: '⏳',
          failed: '❌',
          processing: '🔄'
        };
        text = `${statusEmoji[data.status] || '📝'} <b>Статус замовлення змінено</b>\n\n` +
          `📋 ID: <code>${data.order_id.slice(0, 8)}</code>\n` +
          `👤 Покупець: ${data.user_email}\n` +
          `📊 Новий статус: <b>${data.status}</b>`;
        break;

      case 'new_user':
        text = `👋 <b>Новий користувач!</b>\n\n` +
          `📧 Email: ${data.email}\n` +
          `🆔 ID: <code>${data.user_id.slice(0, 8)}</code>`;
        break;

      case 'promotion':
        text = `🎉 <b>Нова акція!</b>\n\n` +
          `📢 ${data.title}\n` +
          `💰 Знижка: ${data.discount_percent}%\n` +
          `📅 До: ${data.end_date || 'Без обмежень'}`;
        break;

      default:
        text = `📢 ${data.message || 'Нове сповіщення'}`;
    }

    const success = await sendTelegramMessage(botToken, {
      chat_id: chatId,
      text
    });

    console.log('Telegram notification sent:', success);

    return new Response(
      JSON.stringify({ success }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending Telegram notification:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
