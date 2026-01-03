import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: string;
}

async function getAdminSetting(supabase: any, key: string): Promise<string | null> {
  const { data } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  return data?.value || null;
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
    console.log('Telegram API result:', result);
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, action, data, userId, message, orderId } = await req.json();
    console.log('Telegram notify request:', { type, action, userId, orderId });

    const botToken = await getAdminSetting(supabase, 'TELEGRAM_BOT_TOKEN');
    
    if (!botToken) {
      console.log('Telegram bot not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Telegram not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // User notification (send to user's linked Telegram)
    if (action && userId) {
      const { data: telegramUser } = await supabase
        .from('telegram_users')
        .select('telegram_id, is_verified')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .single();

      if (!telegramUser) {
        console.log('User has no verified Telegram');
        return new Response(
          JSON.stringify({ success: false, error: 'No Telegram linked' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let text = '';

      switch (action) {
        case 'order_created':
          const { data: order } = await supabase
            .from('orders')
            .select('id, final_amount, payment_status')
            .eq('id', orderId)
            .single();
          
          if (order) {
            text = `🛒 <b>Нове замовлення!</b>\n\n📋 ID: <code>${order.id.slice(0, 8)}</code>\n💵 Сума: ${order.final_amount} ₴\n\nОплатіть замовлення на сайті.`;
          }
          break;

        case 'order_completed':
          text = `✅ <b>Замовлення оплачено!</b>\n\n📋 ID: <code>${orderId?.slice(0, 8)}</code>\n\nДякуємо за покупку! Товари будуть видані найближчим часом.`;
          break;

        case 'order_failed':
          text = `❌ <b>Помилка оплати</b>\n\n📋 ID: <code>${orderId?.slice(0, 8)}</code>\n\nСпробуйте оплатити знову або зверніться до підтримки.`;
          break;

        case 'ticket_reply':
          text = `💬 <b>Нова відповідь від підтримки!</b>\n\n${message}\n\nПереглянути на сайті або відповісти тут.`;
          break;

        case 'balance_topup':
          text = `💰 <b>Баланс поповнено!</b>\n\n${message}`;
          break;

        default:
          text = message || 'Сповіщення від Exodus DayZ Shop';
      }

      const success = await sendTelegramMessage(botToken, {
        chat_id: telegramUser.telegram_id,
        text
      });

      return new Response(
        JSON.stringify({ success }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin notification (send to admin chat)
    const chatId = await getAdminSetting(supabase, 'TELEGRAM_CHAT_ID');
    
    if (!chatId) {
      console.log('Admin chat not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Admin chat not configured' }),
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

      case 'new_ticket':
        text = `🎫 <b>Новий тікет підтримки!</b>\n\n` +
          `📋 Тема: ${data.subject}\n` +
          `👤 Від: ${data.user_email}\n` +
          `📝 ${data.message}`;
        break;

      default:
        text = `📢 ${data?.message || message || 'Нове сповіщення'}`;
    }

    const success = await sendTelegramMessage(botToken, {
      chat_id: chatId,
      text
    });

    console.log('Admin notification sent:', success);

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
