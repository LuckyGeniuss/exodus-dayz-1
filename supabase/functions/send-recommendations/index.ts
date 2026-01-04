import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Profile {
  id: string;
  username: string | null;
  email_promotions_enabled: boolean | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
}

interface ViewedProduct {
  product_id: string;
}

interface OrderItem {
  product_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log("send-recommendations: Starting execution");

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    const resend = new Resend(resendApiKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all products
    const { data: allProducts, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image, category");

    if (productsError) throw productsError;
    console.log(`Found ${allProducts?.length || 0} products`);

    // Get users who have promotions enabled
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, username, email_promotions_enabled")
      .eq("email_promotions_enabled", true);

    if (usersError) throw usersError;
    console.log(`Found ${users?.length || 0} users with promotions enabled`);

    // Get user emails from auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const emailMap = new Map<string, string>();
    authUsers.users.forEach(u => {
      if (u.email) emailMap.set(u.id, u.email);
    });

    let sentCount = 0;
    let failedCount = 0;
    const details: { userId: string; status: string; error?: string }[] = [];

    for (const user of (users as Profile[]) || []) {
      const userEmail = emailMap.get(user.id);
      if (!userEmail) {
        console.log(`User ${user.id} has no email, skipping`);
        continue;
      }

      try {
        // Get user's viewed products
        const { data: viewedProducts } = await supabase
          .from("viewed_products")
          .select("product_id")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(10);

        // Get user's purchased products
        const { data: orders } = await supabase
          .from("orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("payment_status", "completed");

        const orderIds = orders?.map(o => o.id) || [];
        let purchasedProductIds: string[] = [];

        if (orderIds.length > 0) {
          const { data: orderItems } = await supabase
            .from("order_items")
            .select("product_id")
            .in("order_id", orderIds);

          purchasedProductIds = (orderItems as OrderItem[])?.map(i => i.product_id) || [];
        }

        // Get categories user is interested in
        const viewedIds = (viewedProducts as ViewedProduct[])?.map(v => v.product_id) || [];
        const viewedProductsData = (allProducts as Product[])?.filter(p => viewedIds.includes(p.id)) || [];
        const interestedCategories = [...new Set(viewedProductsData.map(p => p.category))];

        // Get recommended products (same categories, not purchased)
        let recommendations = (allProducts as Product[])?.filter(p => 
          interestedCategories.includes(p.category) && 
          !purchasedProductIds.includes(p.id) &&
          !viewedIds.includes(p.id)
        ) || [];

        // If not enough recommendations, add popular products
        if (recommendations.length < 4) {
          const additionalProducts = (allProducts as Product[])?.filter(p => 
            !purchasedProductIds.includes(p.id) && 
            !recommendations.find(r => r.id === p.id)
          ) || [];
          recommendations = [...recommendations, ...additionalProducts.slice(0, 4 - recommendations.length)];
        }

        // Take top 4 recommendations
        recommendations = recommendations.slice(0, 4);

        if (recommendations.length === 0) {
          console.log(`No recommendations for user ${user.id}, skipping`);
          continue;
        }

        // Generate email HTML
        const productsHtml = recommendations.map(p => `
          <div style="display: inline-block; width: 48%; margin: 5px; padding: 15px; border: 1px solid #333; border-radius: 8px; background: #1a1a1a;">
            ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;"/>` : ''}
            <h4 style="color: #fff; margin: 10px 0 5px;">${p.name}</h4>
            <p style="color: #f97316; font-weight: bold; margin: 0;">${p.price} ₴</p>
          </div>
        `).join("");

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #f97316;">🎮 Спеціально для вас!</h1>
              <p>Привіт${user.username ? `, ${user.username}` : ''}!</p>
              <p>На основі ваших переглядів ми підібрали товари, які можуть вас зацікавити:</p>
              
              <div style="margin: 20px 0;">
                ${productsHtml}
              </div>
              
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/#shop" 
                 style="display: inline-block; background: #f97316; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Переглянути всі товари
              </a>
              
              <p style="margin-top: 30px; font-size: 12px; color: #666;">
                Якщо ви не хочете отримувати такі листи, <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/profile" style="color: #f97316;">відмовтесь у налаштуваннях профілю</a>.
              </p>
            </div>
          </body>
          </html>
        `;

        await resend.emails.send({
          from: "DayZ Shop <noreply@resend.dev>",
          to: [userEmail],
          subject: "🎁 Персональні рекомендації для вас!",
          html: emailHtml,
        });

        sentCount++;
        details.push({ userId: user.id, status: "sent" });
        console.log(`Sent recommendations to user ${user.id}`);
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        details.push({ userId: user.id, status: "failed", error: errorMessage });
        console.error(`Failed to send to user ${user.id}:`, error);
      }
    }

    // Log the notification
    await supabase.from("notification_logs").insert({
      type: "recommendations",
      recipients_count: (users?.length || 0),
      sent_count: sentCount,
      failed_count: failedCount,
      details,
      completed_at: new Date().toISOString(),
    });

    const duration = Date.now() - startTime;
    console.log(`send-recommendations completed in ${duration}ms. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        failed: failedCount,
        duration 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("send-recommendations error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
