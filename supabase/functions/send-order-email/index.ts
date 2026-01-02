import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  email: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  finalAmount: number;
  discountAmount?: number;
}

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Invalid authentication:", userError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, orderNumber, items, totalAmount, finalAmount, discountAmount }: OrderEmailRequest = await req.json();

    // Verify the email belongs to the authenticated user
    if (user.email !== email) {
      console.error("Email mismatch: requested email does not match authenticated user");
      return new Response(
        JSON.stringify({ error: 'Email mismatch' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Escape all user-controlled data to prevent XSS
    const escapedOrderNumber = escapeHtml(orderNumber);
    
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${escapeHtml(item.quantity.toString())}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${escapeHtml(item.price.toString())}₴</td>
      </tr>
    `).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎮 Exodus Shop</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Дякуємо за замовлення!</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Привіт! 👋</p>
            
            <p>Ваше замовлення <strong>#${escapedOrderNumber}</strong> успішно оформлено!</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px; font-size: 18px; color: #667eea;">Деталі замовлення</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; font-weight: 600;">Товар</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600;">К-сть</th>
                    <th style="padding: 12px; text-align: right; font-weight: 600;">Ціна</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
                ${discountAmount && discountAmount > 0 ? `
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #6b7280;">
                    <span>Сума:</span>
                    <span>${totalAmount.toFixed(2)}₴</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #10b981;">
                    <span>Знижка:</span>
                    <span>-${discountAmount.toFixed(2)}₴</span>
                  </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; color: #667eea;">
                  <span>Всього:</span>
                  <span>${finalAmount.toFixed(2)}₴</span>
                </div>
              </div>
            </div>
            
            <p>Після оплати товари будуть додані до вашого аккаунту автоматично.</p>
            
            <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
              <p style="margin: 0; font-weight: 600; color: #92400e;">💡 Важлива інформація:</p>
              <p style="margin: 10px 0 0; color: #92400e;">Перевірте папку "Спам", якщо не бачите листа в основній скриньці.</p>
            </div>
            
            <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
              Якщо у вас виникли питання, зв'яжіться з нашою підтримкою.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                З повагою,<br>
                <strong style="color: #667eea;">Команда Exodus Shop</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Exodus Shop <onboarding@resend.dev>",
      to: [email],
      subject: `Замовлення #${escapedOrderNumber} оформлено ✅`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
