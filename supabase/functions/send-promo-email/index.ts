import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PromoEmailRequest {
  type: "new_product" | "discount" | "flash_sale" | "newsletter";
  subject: string;
  title: string;
  message: string;
  productIds?: string[];
  discountPercent?: number;
  ctaUrl?: string;
  ctaText?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, subject, title, message, productIds, discountPercent, ctaUrl, ctaText }: PromoEmailRequest = await req.json();

    console.log(`Sending ${type} promo email: ${subject}`);

    // Get subscribed users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email_promotions_enabled")
      .eq("email_promotions_enabled", true);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Get emails from auth
    const { data: authData } = await supabase.auth.admin.listUsers();
    
    const subscribedEmails = authData?.users
      ?.filter(user => profiles?.some(p => p.id === user.id))
      ?.map(user => user.email)
      ?.filter(Boolean) as string[] || [];

    console.log(`Found ${subscribedEmails.length} subscribed users`);

    if (subscribedEmails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Немає підписаних користувачів", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get product details if specified
    let productHtml = "";
    if (productIds && productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, image")
        .in("id", productIds);

      if (products && products.length > 0) {
        productHtml = `
          <div style="margin: 20px 0;">
            <h3 style="color: #f59e0b; margin-bottom: 15px;">Товари:</h3>
            ${products.map(p => `
              <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 10px; background: #1f1f1f; border-radius: 8px;">
                ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;" />` : ''}
                <div>
                  <strong style="color: #fff;">${p.name}</strong>
                  <div style="color: #f59e0b; font-weight: bold;">${p.price} ₴</div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }
    }

    const discountBadge = discountPercent ? `
      <div style="display: inline-block; background: linear-gradient(135deg, #ef4444, #f97316); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
        -${discountPercent}%
      </div>
    ` : "";

    const ctaButton = ctaUrl ? `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
          ${ctaText || "Дивитися"}
        </a>
      </div>
    ` : "";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; border-bottom: 1px solid #333;">
            <h1 style="margin: 0; font-size: 28px;">
              <span style="color: #f59e0b;">EXODUS</span>
              <span style="color: #fff;"> DayZ</span>
            </h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 20px; background: #111; border-radius: 8px; margin-top: 20px;">
            ${discountBadge}
            <h2 style="color: #fff; font-size: 24px; margin: 0 0 20px 0;">${title}</h2>
            <p style="color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              ${message}
            </p>
            ${productHtml}
            ${ctaButton}
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px; color: #666; font-size: 12px;">
            <p style="margin: 0 0 10px 0;">
              Ви отримали цей лист, тому що підписані на розсилку Exodus DayZ.
            </p>
            <p style="margin: 0;">
              © ${new Date().getFullYear()} Exodus DayZ. Всі права захищено.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches of 50
    const batchSize = 50;
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < subscribedEmails.length; i += batchSize) {
      const batch = subscribedEmails.slice(i, i + batchSize);
      
      try {
        const result = await resend.emails.send({
          from: "Exodus DayZ <noreply@exodusdayz.com>",
          to: batch,
          subject: subject,
          html: emailHtml,
        });

        console.log(`Batch ${Math.floor(i / batchSize) + 1} sent:`, result);
        sentCount += batch.length;
      } catch (batchError) {
        console.error(`Error sending batch ${Math.floor(i / batchSize) + 1}:`, batchError);
        failedCount += batch.length;
      }
    }

    // Log the notification
    await supabase.from("notification_logs").insert({
      type: `email_promo_${type}`,
      recipients_count: subscribedEmails.length,
      sent_count: sentCount,
      failed_count: failedCount,
      details: { subject, title, productIds },
      completed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: subscribedEmails.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-promo-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
