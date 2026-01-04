import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find users with abandoned carts (items added more than 24 hours ago, less than 7 days)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: abandonedCarts, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        user_id,
        product_id,
        product_name,
        product_price,
        quantity,
        added_at
      `)
      .lt('added_at', twentyFourHoursAgo)
      .gt('added_at', sevenDaysAgo);

    if (cartError) throw cartError;

    if (!abandonedCarts || abandonedCarts.length === 0) {
      console.log("No abandoned carts found");
      return new Response(JSON.stringify({ message: "No abandoned carts" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Group by user
    const userCarts = abandonedCarts.reduce((acc, item) => {
      if (!acc[item.user_id]) {
        acc[item.user_id] = [];
      }
      acc[item.user_id].push(item);
      return acc;
    }, {} as Record<string, CartItem[]>);

    let emailsSent = 0;

    for (const [userId, items] of Object.entries(userCarts)) {
      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      if (!userData.user?.email) continue;

      const email = userData.user.email;
      const totalAmount = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);

      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #2A2A2B;">
            <span style="color: #ffffff;">${item.product_name}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #2A2A2B; text-align: center;">
            <span style="color: #9CA3AF;">×${item.quantity}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #2A2A2B; text-align: right;">
            <span style="color: #EA580C; font-weight: 600;">${item.product_price * item.quantity}₴</span>
          </td>
        </tr>
      `).join('');

      console.log(`Sending cart reminder to ${email}`);

      await resend.emails.send({
        from: "Exodus DayZ <noreply@resend.dev>",
        to: [email],
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
              <div style="background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; color: #ffffff;">🛒 Exodus DayZ</h1>
              </div>
              
              <div style="padding: 40px;">
                <h2 style="color: #ffffff; margin: 0 0 20px;">Привіт! 👋</h2>
                
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
                        <td style="padding: 15px; text-align: right; color: #EA580C; font-size: 20px; font-weight: bold;">${totalAmount}₴</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://exodus-dayz.lovable.app/checkout" style="display: inline-block; background: linear-gradient(135deg, #EA580C 0%, #F97316 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Завершити покупку
                  </a>
                </div>
                
                <p style="color: #6B7280; text-align: center; margin-top: 25px; font-size: 14px;">
                  Товари залишаться в кошику ще 7 днів
                </p>
              </div>
              
              <div style="background-color: #0A0A0B; padding: 20px; text-align: center; border-top: 1px solid #2A2A2B;">
                <p style="color: #6B7280; margin: 0; font-size: 12px;">
                  © 2024 Exodus DayZ. Всі права захищено.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      emailsSent++;
    }

    console.log(`Sent ${emailsSent} cart reminder emails`);

    return new Response(JSON.stringify({ success: true, emailsSent }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-cart-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
