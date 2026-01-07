import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  user_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  added_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get settings from admin_settings
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("key, value")
      .in("key", ["RESEND_API_KEY", "TELEGRAM_BOT_TOKEN"]);

    const resendApiKey = settings?.find((s) => s.key === "RESEND_API_KEY")?.value;
    const telegramBotToken = settings?.find((s) => s.key === "TELEGRAM_BOT_TOKEN")?.value;

    console.log("Resend configured:", !!resendApiKey);
    console.log("Telegram configured:", !!telegramBotToken);

    // Get abandoned cart items (added between 24 hours and 7 days ago)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select("user_id, product_name, product_price, quantity, added_at")
      .lt("added_at", twentyFourHoursAgo)
      .gt("added_at", sevenDaysAgo);

    if (cartError) {
      console.error("Error fetching cart items:", cartError);
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      console.log("No abandoned carts found");
      return new Response(
        JSON.stringify({ success: true, message: "No abandoned carts", emailsSent: 0, telegramSent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group cart items by user
    const userCarts = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const existing = userCarts.get(item.user_id) || [];
      existing.push(item);
      userCarts.set(item.user_id, existing);
    }

    let emailsSent = 0;
    let telegramSent = 0;
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get notification log to avoid duplicate reminders (max once per day per user)
    const today = new Date().toISOString().split('T')[0];
    const { data: recentLogs } = await supabase
      .from("notification_logs")
      .select("details")
      .eq("type", "cart_reminder")
      .gte("created_at", `${today}T00:00:00.000Z`);

    const notifiedUsersToday = new Set<string>();
    recentLogs?.forEach(log => {
      if (log.details && typeof log.details === 'object' && 'users' in log.details) {
        (log.details as { users: string[] }).users?.forEach((u: string) => notifiedUsersToday.add(u));
      }
    });

    const notifiedUsers: string[] = [];

    for (const [userId, items] of userCarts) {
      // Skip if already notified today
      if (notifiedUsersToday.has(userId)) {
        console.log(`User ${userId} already notified today, skipping`);
        continue;
      }

      // Get user info
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const userEmail = authUser?.user?.email;

      // Get telegram info
      const { data: telegramUser } = await supabase
        .from("telegram_users")
        .select("telegram_id, is_verified")
        .eq("user_id", userId)
        .eq("is_verified", true)
        .single();

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      const username = profile?.username || "Користувач";
      const totalAmount = items.reduce((sum, item) => sum + (item.product_price || 0) * (item.quantity || 1), 0);

      // Send Email
      if (resend && userEmail) {
        try {
          const itemsHtml = items.map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #2A2A2B;">
                <span style="color: #ffffff;">${item.product_name || "Товар"}</span>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #2A2A2B; text-align: center;">
                <span style="color: #9CA3AF;">×${item.quantity || 1}</span>
              </td>
              <td style="padding: 12px; border-bottom: 1px solid #2A2A2B; text-align: right;">
                <span style="color: #22c55e; font-weight: 600;">${(item.product_price || 0) * (item.quantity || 1)} ₴</span>
              </td>
            </tr>
          `).join('');

          await resend.emails.send({
            from: "Exodus DayZ Shop <noreply@resend.dev>",
            to: [userEmail],
            subject: "🛒 Ви забули про свій кошик!",
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0A0B; color: #ffffff; margin: 0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1B; border-radius: 16px; overflow: hidden; border: 1px solid #2A2A2B;">
                  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🛒 Exodus DayZ</h1>
                  </div>
                  
                  <div style="padding: 40px;">
                    <h2 style="color: #ffffff; margin: 0 0 20px;">Привіт, ${username}! 👋</h2>
                    
                    <p style="color: #9CA3AF; line-height: 1.6; margin-bottom: 25px;">
                      Ми помітили, що у вас залишились товари в кошику. Не забудьте завершити покупку!
                    </p>
                    
                    <div style="background-color: #2A2A2B; border-radius: 12px; overflow: hidden; margin: 25px 0;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background-color: #0A0A0B;">
                            <th style="padding: 12px; text-align: left; color: #9CA3AF; font-weight: 500;">Товар</th>
                            <th style="padding: 12px; text-align: center; color: #9CA3AF; font-weight: 500;">К-ть</th>
                            <th style="padding: 12px; text-align: right; color: #9CA3AF; font-weight: 500;">Ціна</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="2" style="padding: 15px; text-align: right; color: #ffffff; font-weight: 600;">Разом:</td>
                            <td style="padding: 15px; text-align: right; color: #22c55e; font-size: 20px; font-weight: bold;">${totalAmount.toFixed(2)} ₴</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div style="background-color: #22c55e20; border: 1px solid #22c55e40; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                      <p style="color: #22c55e; margin: 0; font-weight: 600;">
                        🎁 Використайте промокод <code style="background: #22c55e; color: #000; padding: 2px 8px; border-radius: 4px;">COMEBACK10</code> для знижки 10%!
                      </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://exodus-dayz-shop.lovable.app/checkout" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        Завершити покупку →
                      </a>
                    </div>
                    
                    <p style="color: #6B7280; text-align: center; margin-top: 25px; font-size: 14px;">
                      Товари залишаться в кошику ще 7 днів
                    </p>
                  </div>
                  
                  <div style="background-color: #0A0A0B; padding: 20px; text-align: center; border-top: 1px solid #2A2A2B;">
                    <p style="color: #6B7280; margin: 0; font-size: 12px;">
                      © 2025 Exodus DayZ. Всі права захищено.<br>
                      Якщо ви не хочете отримувати такі листи, вимкніть сповіщення в налаштуваннях профілю.
                    </p>
                  </div>
                </div>
              </body>
              </html>
            `,
          });
          emailsSent++;
          console.log(`Email sent to ${userEmail}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${userEmail}:`, emailError);
        }
      }

      // Send Telegram notification
      if (telegramBotToken && telegramUser?.telegram_id) {
        try {
          const telegramMessage = `🛒 <b>Ви забули про свій кошик!</b>

Привіт, ${username}! 👋

У вашому кошику залишились товари:

${items.map((item) => `• ${item.product_name || "Товар"} ×${item.quantity || 1} — ${item.product_price || 0} ₴`).join("\n")}

💰 <b>Всього: ${totalAmount.toFixed(2)} ₴</b>

🎁 Використайте промокод <code>COMEBACK10</code> для знижки 10%!

👉 Завершіть покупку на сайті: exodus-dayz-shop.lovable.app/checkout`;

          const telegramResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: telegramUser.telegram_id,
                text: telegramMessage,
                parse_mode: "HTML",
              }),
            }
          );

          if (telegramResponse.ok) {
            telegramSent++;
            console.log(`Telegram sent to user ${userId}`);
          } else {
            const errorData = await telegramResponse.text();
            console.error(`Telegram send failed for user ${userId}:`, errorData);
          }
        } catch (tgError) {
          console.error(`Failed to send Telegram to user ${userId}:`, tgError);
        }
      }

      notifiedUsers.push(userId);
    }

    // Log notification
    if (notifiedUsers.length > 0) {
      await supabase.from("notification_logs").insert({
        type: "cart_reminder",
        recipients_count: notifiedUsers.length,
        sent_count: emailsSent + telegramSent,
        failed_count: notifiedUsers.length * 2 - emailsSent - telegramSent,
        details: {
          users: notifiedUsers,
          emails_sent: emailsSent,
          telegram_sent: telegramSent,
        },
        completed_at: new Date().toISOString(),
      });
    }

    console.log(`Cart reminders complete: ${emailsSent} emails, ${telegramSent} telegrams sent`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        telegramSent,
        usersNotified: notifiedUsers.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-cart-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
