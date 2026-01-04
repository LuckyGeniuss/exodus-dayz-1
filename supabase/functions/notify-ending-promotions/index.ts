import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface Promotion {
  id: string;
  product_id: string;
  discount_percent: number;
  end_date: string;
  flash_title: string | null;
}

interface FlashSale {
  id: string;
  title: string;
  discount_percent: number;
  end_date: string;
}

interface Banner {
  id: string;
  title: string;
  end_date: string;
}

interface Profile {
  id: string;
  username: string | null;
  email_promotions_enabled: boolean | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find promotions ending within 24 hours
    const { data: endingPromotions } = await supabase
      .from("promotions")
      .select("id, product_id, discount_percent, end_date, flash_title")
      .eq("is_active", true)
      .gte("end_date", now.toISOString())
      .lte("end_date", in24Hours.toISOString()) as { data: Promotion[] | null };

    // Find flash sales ending within 24 hours
    const { data: endingFlashSales } = await supabase
      .from("flash_sales")
      .select("id, title, discount_percent, end_date")
      .eq("is_active", true)
      .gte("end_date", now.toISOString())
      .lte("end_date", in24Hours.toISOString()) as { data: FlashSale[] | null };

    // Find banners ending within 24 hours
    const { data: endingBanners } = await supabase
      .from("homepage_banners")
      .select("id, title, end_date")
      .eq("is_active", true)
      .not("end_date", "is", null)
      .gte("end_date", now.toISOString())
      .lte("end_date", in24Hours.toISOString()) as { data: Banner[] | null };

    const totalEndingItems = 
      (endingPromotions?.length || 0) + 
      (endingFlashSales?.length || 0) + 
      (endingBanners?.length || 0);

    if (totalEndingItems === 0) {
      return new Response(
        JSON.stringify({ message: "No ending promotions found", notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all users with verified emails
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to get users: ${authError.message}`);
    }

    const usersWithEmail = authUsers.users.filter(u => u.email);

    // Get user profiles for usernames and email preferences
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, email_promotions_enabled") as { data: Profile[] | null };

    const profileMap = new Map(profiles?.map(p => [p.id, { username: p.username, emailEnabled: p.email_promotions_enabled !== false }]) || []);

    // Filter users who have email notifications enabled
    const eligibleUsers = usersWithEmail.filter(u => {
      const profile = profileMap.get(u.id);
      return profile?.emailEnabled !== false;
    });

    // Build email content
    let promotionsList = "";

    if (endingPromotions && endingPromotions.length > 0) {
      const productIds = endingPromotions.map(p => p.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);
      
      const productMap = new Map(products?.map(p => [p.id, p.name]) || []);
      
      promotionsList += `
        <h3 style="color: #f97316; margin-top: 20px;">🔥 Акційні товари:</h3>
        <ul style="padding-left: 20px;">
          ${endingPromotions.map(p => {
            const endTime = new Date(p.end_date);
            const hoursLeft = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60));
            return `<li style="margin: 10px 0;">
              <strong>${productMap.get(p.product_id) || p.product_id}</strong> - 
              <span style="color: #ef4444; font-weight: bold;">-${p.discount_percent}%</span>
              <br><span style="color: #6b7280; font-size: 12px;">Залишилось: ~${hoursLeft} годин</span>
            </li>`;
          }).join("")}
        </ul>
      `;
    }

    if (endingFlashSales && endingFlashSales.length > 0) {
      promotionsList += `
        <h3 style="color: #dc2626; margin-top: 20px;">⚡ Flash Sale закінчуються:</h3>
        <ul style="padding-left: 20px;">
          ${endingFlashSales.map(fs => {
            const endTime = new Date(fs.end_date);
            const hoursLeft = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60));
            return `<li style="margin: 10px 0;">
              <strong>${fs.title}</strong> - 
              <span style="color: #ef4444; font-weight: bold;">-${fs.discount_percent}%</span>
              <br><span style="color: #6b7280; font-size: 12px;">Залишилось: ~${hoursLeft} годин</span>
            </li>`;
          }).join("")}
        </ul>
      `;
    }

    if (endingBanners && endingBanners.length > 0) {
      promotionsList += `
        <h3 style="color: #8b5cf6; margin-top: 20px;">📢 Спеціальні пропозиції:</h3>
        <ul style="padding-left: 20px;">
          ${endingBanners.map(b => {
            const endTime = new Date(b.end_date);
            const hoursLeft = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60));
            return `<li style="margin: 10px 0;">
              <strong>${b.title}</strong>
              <br><span style="color: #6b7280; font-size: 12px;">Залишилось: ~${hoursLeft} годин</span>
            </li>`;
          }).join("")}
        </ul>
      `;
    }

    // Create notification log entry
    const { data: logEntry } = await supabase
      .from("notification_logs")
      .insert({
        type: "ending_promotions",
        recipients_count: eligibleUsers.length,
        sent_count: 0,
        failed_count: 0,
        details: {
          endingPromotions: endingPromotions?.length || 0,
          endingFlashSales: endingFlashSales?.length || 0,
          endingBanners: endingBanners?.length || 0,
        },
      })
      .select()
      .single();

    let sentCount = 0;
    let failedCount = 0;

    // Send emails to eligible users
    for (const user of eligibleUsers) {
      const profile = profileMap.get(user.id);
      const username = profile?.username || "Виживач";
      
      try {
        await resend.emails.send({
          from: "Exodus DayZ <onboarding@resend.dev>",
          to: [user.email!],
          subject: "⏰ Акції закінчуються! Не пропусти знижки на Exodus DayZ",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #18181b; color: #fafafa; padding: 30px; border-radius: 10px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f97316; margin: 0;">EXODUS DayZ</h1>
                <p style="color: #a1a1aa; margin: 5px 0;">Магазин ігрових товарів</p>
              </div>
              
              <h2 style="color: #fafafa;">Привіт, ${username}! 👋</h2>
              
              <p style="color: #d4d4d8; line-height: 1.6;">
                Поспішай! Деякі акції на нашому сайті закінчуються протягом 24 годин. 
                Не пропусти можливість заощадити!
              </p>
              
              <div style="background: #27272a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                ${promotionsList}
              </div>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://exodus-dayz.lovable.app" 
                   style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  🛒 Перейти до магазину
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 30px;">
                Ви отримали цей лист, оскільки підписані на сповіщення про акції Exodus DayZ.<br>
                Ви можете відписатися в налаштуваннях профілю.
              </p>
            </div>
          `,
        });
        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        failedCount++;
      }
    }

    // Update notification log
    if (logEntry) {
      await supabase
        .from("notification_logs")
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    // Create in-app notifications for eligible users
    for (const user of eligibleUsers) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "promotion",
        title: "Акції закінчуються!",
        message: `${totalEndingItems} акцій закінчуються протягом 24 годин. Не пропусти знижки!`,
        data: { 
          endingPromotions: endingPromotions?.length || 0,
          endingFlashSales: endingFlashSales?.length || 0,
          endingBanners: endingBanners?.length || 0,
        },
      });
    }

    console.log(`Notification sent: ${sentCount} emails, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent",
        emailsSent: sentCount,
        emailsFailed: failedCount,
        promotionsEnding: endingPromotions?.length || 0,
        flashSalesEnding: endingFlashSales?.length || 0,
        bannersEnding: endingBanners?.length || 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-ending-promotions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
