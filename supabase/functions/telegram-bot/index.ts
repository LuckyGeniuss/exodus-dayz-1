import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    text?: string;
    date: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Telegram bot token from settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['TELEGRAM_BOT_TOKEN']);

    const botToken = settings?.find(s => s.key === 'TELEGRAM_BOT_TOKEN')?.value;

    if (!botToken) {
      console.error('Telegram bot token not configured');
      return new Response(
        JSON.stringify({ error: 'Bot not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const update: TelegramUpdate = await req.json();
    console.log('Received Telegram update:', update);

    if (!update.message?.text) {
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const chatId = update.message.chat.id;
    const telegramUserId = update.message.from.id;
    const username = update.message.from.username;
    const text = update.message.text.trim();

    // Send message helper
    const sendMessage = async (text: string, parseMode = 'HTML') => {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: parseMode,
        }),
      });
    };

    // Get linked user
    const { data: telegramUser } = await supabase
      .from('telegram_users')
      .select('user_id, is_verified')
      .eq('telegram_id', telegramUserId)
      .single();

    // Handle commands
    if (text.startsWith('/start')) {
      const verificationCode = text.split(' ')[1];

      if (verificationCode) {
        // Try to verify account
        const { data: pendingUser, error } = await supabase
          .from('telegram_users')
          .update({ 
            telegram_id: telegramUserId, 
            telegram_username: username,
            is_verified: true 
          })
          .eq('verification_code', verificationCode)
          .select()
          .single();

        if (pendingUser) {
          await sendMessage('✅ <b>Акаунт успішно прив\'язано!</b>\n\nТепер ви можете використовувати команди:\n/balance - перевірити баланс\n/orders - ваші замовлення\n/support - створити тікет підтримки');
        } else {
          await sendMessage('❌ Невірний код верифікації');
        }
      } else {
        await sendMessage('👋 <b>Привіт!</b>\n\nЯ бот магазину Exodus DayZ Shop.\n\nДля прив\'язки акаунту перейдіть на сайт у профіль та натисніть "Прив\'язати Telegram".\n\nДоступні команди:\n/balance - баланс\n/orders - замовлення\n/support - підтримка');
      }
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (text === '/help') {
      await sendMessage('📋 <b>Доступні команди:</b>\n\n/balance - перевірити баланс\n/orders - список замовлень\n/support - створити тікет підтримки\n/link - отримати код для прив\'язки');
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if user is verified for protected commands
    if (!telegramUser?.is_verified) {
      await sendMessage('⚠️ Ваш акаунт не прив\'язано.\n\nПерейдіть у профіль на сайті та натисніть "Прив\'язати Telegram".');
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (text === '/balance') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance, username, is_veteran')
        .eq('id', telegramUser.user_id)
        .single();

      if (profile) {
        const veteranBadge = profile.is_veteran ? ' 🎖️ Ветеран' : '';
        await sendMessage(`💰 <b>Ваш баланс:</b> ${profile.balance?.toFixed(2) || 0} ₴\n\n👤 ${profile.username}${veteranBadge}`);
      }
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (text === '/orders') {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, final_amount, payment_status, created_at')
        .eq('user_id', telegramUser.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders && orders.length > 0) {
        const statusEmoji: Record<string, string> = {
          pending: '⏳',
          completed: '✅',
          failed: '❌',
        };

        let message = '📦 <b>Ваші останні замовлення:</b>\n\n';
        orders.forEach((order, i) => {
          const emoji = statusEmoji[order.payment_status] || '❓';
          const date = new Date(order.created_at).toLocaleDateString('uk-UA');
          message += `${i + 1}. ${emoji} <code>${order.id.slice(0, 8)}</code>\n   💵 ${order.final_amount} ₴ | ${date}\n\n`;
        });

        await sendMessage(message);
      } else {
        await sendMessage('📦 У вас ще немає замовлень');
      }
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (text === '/support' || text.startsWith('/support ')) {
      const supportMessage = text.replace('/support', '').trim();

      if (!supportMessage) {
        await sendMessage('💬 <b>Створення тікету підтримки</b>\n\nВикористовуйте команду:\n<code>/support Ваше повідомлення</code>\n\nНаприклад:\n<code>/support Не можу оплатити замовлення</code>');
      } else {
        // Create support ticket
        const { data: ticket, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: telegramUser.user_id,
            subject: 'Звернення з Telegram',
            priority: 'medium',
          })
          .select()
          .single();

        if (ticket) {
          await supabase.from('ticket_messages').insert({
            ticket_id: ticket.id,
            sender_id: telegramUser.user_id,
            message: supportMessage,
            is_admin: false,
          });

          await sendMessage(`✅ <b>Тікет створено!</b>\n\n📋 ID: <code>${ticket.id.slice(0, 8)}</code>\n\nМи відповімо якнайшвидше. Відповідь прийде сюди в Telegram.`);
        } else {
          await sendMessage('❌ Помилка створення тікету. Спробуйте пізніше.');
        }
      }
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Unknown command
    if (text.startsWith('/')) {
      await sendMessage('❓ Невідома команда. Використовуйте /help для списку команд.');
    }

    return new Response(JSON.stringify({ ok: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Telegram bot error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
