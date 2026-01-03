import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  username?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, username }: WelcomeEmailRequest = await req.json();
    const displayName = username || email.split('@')[0];

    console.log(`Sending welcome email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Exodus DayZ <noreply@resend.dev>",
      to: [email],
      subject: "🎮 Ласкаво просимо до Exodus DayZ!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0A0A0B; color: #ffffff; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1B; border-radius: 16px; overflow: hidden; border: 1px solid #2A2A2B;">
            <div style="background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 10px; font-size: 32px; color: #ffffff;">🎮 Exodus DayZ</h1>
              <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.9);">Ласкаво просимо до найкращих DayZ серверів!</p>
            </div>
            
            <div style="padding: 40px;">
              <h2 style="color: #ffffff; margin: 0 0 20px;">Привіт, ${displayName}! 👋</h2>
              
              <p style="color: #9CA3AF; line-height: 1.6; margin-bottom: 20px;">
                Дякуємо за реєстрацію на Exodus DayZ! Тепер ви можете користуватися всіма перевагами нашого магазину.
              </p>
              
              <div style="background-color: #2A2A2B; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #EA580C; margin: 0 0 15px;">🎁 Що вас чекає:</h3>
                <ul style="color: #9CA3AF; padding-left: 20px; margin: 0; line-height: 1.8;">
                  <li>Щоденні бонуси за вхід</li>
                  <li>Колесо фортуни раз на тиждень</li>
                  <li>Система лояльності з кешбеком</li>
                  <li>Реферальна програма</li>
                  <li>Ексклюзивні знижки для ветеранів</li>
                </ul>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(234,88,12,0.2) 0%, rgba(249,115,22,0.2) 100%); border: 1px solid #EA580C; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
                <p style="color: #EA580C; font-size: 14px; margin: 0 0 5px;">Ваш перший бонус</p>
                <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">🎰 Безкоштовне обертання колеса!</p>
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://exodus-dayz.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Перейти до магазину
                </a>
              </div>
            </div>
            
            <div style="background-color: #0A0A0B; padding: 25px; text-align: center; border-top: 1px solid #2A2A2B;">
              <p style="color: #6B7280; margin: 0 0 10px; font-size: 14px;">
                Приєднуйтесь до нашого Discord спільноти!
              </p>
              <p style="color: #6B7280; margin: 0; font-size: 12px;">
                © 2024 Exodus DayZ. Всі права захищено.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
