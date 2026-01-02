import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { order_id, user_email, total_amount, payment_method, items } = await req.json();

    // Get Discord webhook URL from admin settings
    const webhookUrl = await getAdminSetting(supabaseUrl, supabaseServiceKey, 'DISCORD_WEBHOOK_URL');

    if (!webhookUrl) {
      console.log('Discord webhook not configured, skipping notification');
      return new Response(
        JSON.stringify({ success: false, message: 'Discord webhook not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format items list
    const itemsList = (items as OrderItem[])
      .map(item => `• ${item.product_name} x${item.quantity} — ${item.product_price * item.quantity} ₴`)
      .join('\n');

    // Create Discord embed
    const embed: DiscordEmbed = {
      title: '🛒 Нове замовлення!',
      description: `Замовлення **#${order_id.slice(0, 8)}** успішно оформлено`,
      color: 0x22c55e, // Green color
      fields: [
        {
          name: '👤 Покупець',
          value: user_email || 'Невідомо',
          inline: true,
        },
        {
          name: '💰 Сума',
          value: `**${total_amount} ₴**`,
          inline: true,
        },
        {
          name: '💳 Метод оплати',
          value: payment_method || 'Невідомо',
          inline: true,
        },
        {
          name: '📦 Товари',
          value: itemsList || 'Немає даних',
          inline: false,
        },
      ],
      footer: {
        text: 'Exodus DayZ Shop',
      },
      timestamp: new Date().toISOString(),
    };

    // Send to Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord webhook error:', errorText);
      throw new Error(`Discord API error: ${discordResponse.status}`);
    }

    console.log('Discord notification sent for order:', order_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending Discord notification:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
