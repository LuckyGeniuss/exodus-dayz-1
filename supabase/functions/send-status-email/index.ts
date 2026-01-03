import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  email: string;
  orderId: string;
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  orderAmount: number;
}

const getStatusContent = (status: string) => {
  switch (status) {
    case 'processing':
      return {
        title: 'Замовлення обробляється',
        message: 'Ваше замовлення прийнято та зараз обробляється. Очікуйте на підтвердження оплати.',
        color: '#F59E0B',
        emoji: '⏳'
      };
    case 'completed':
      return {
        title: 'Замовлення виконано!',
        message: 'Ваше замовлення успішно оплачено та виконано. Товари вже доступні на вашому акаунті!',
        color: '#10B981',
        emoji: '✅'
      };
    case 'failed':
      return {
        title: 'Помилка оплати',
        message: 'На жаль, оплата замовлення не вдалась. Спробуйте ще раз або зверніться до підтримки.',
        color: '#EF4444',
        emoji: '❌'
      };
    case 'cancelled':
      return {
        title: 'Замовлення скасовано',
        message: 'Ваше замовлення було скасовано. Якщо це помилка, зверніться до підтримки.',
        color: '#6B7280',
        emoji: '🚫'
      };
    default:
      return {
        title: 'Статус замовлення',
        message: 'Статус вашого замовлення було оновлено.',
        color: '#3B82F6',
        emoji: '📦'
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, orderId, status, orderAmount }: StatusEmailRequest = await req.json();
    const statusContent = getStatusContent(status);

    console.log(`Sending status email to ${email} for order ${orderId}, status: ${status}`);

    const emailResponse = await resend.emails.send({
      from: "Exodus DayZ <noreply@resend.dev>",
      to: [email],
      subject: `${statusContent.emoji} ${statusContent.title} - Замовлення #${orderId.slice(0, 8)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0A0B; color: #ffffff; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1B; border-radius: 16px; overflow: hidden; border: 1px solid #2A2A2B;">
            <div style="background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; color: #ffffff;">Exodus DayZ</h1>
            </div>
            
            <div style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">${statusContent.emoji}</span>
                <h2 style="color: ${statusContent.color}; margin: 20px 0 10px;">${statusContent.title}</h2>
                <p style="color: #9CA3AF; margin: 0;">${statusContent.message}</p>
              </div>
              
              <div style="background-color: #2A2A2B; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                  <span style="color: #9CA3AF;">Номер замовлення:</span>
                  <span style="color: #ffffff; font-weight: 600;">#${orderId.slice(0, 8).toUpperCase()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #9CA3AF;">Сума:</span>
                  <span style="color: #EA580C; font-weight: 600;">${orderAmount}₴</span>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://exodus-dayz.lovable.app/orders" style="display: inline-block; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                  Переглянути замовлення
                </a>
              </div>
            </div>
            
            <div style="background-color: #0A0A0B; padding: 20px; text-align: center; border-top: 1px solid #2A2A2B;">
              <p style="color: #6B7280; margin: 0; font-size: 14px;">
                © 2024 Exodus DayZ. Всі права захищено.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Status email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
