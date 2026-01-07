-- ============================================
-- EXODUS DAYZ SHOP - DATABASE DUMP
-- Version: 3.0.0
-- Generated: 2025
-- Tables: 48 | Functions: 7 | Enums: 1
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('user', 'veteran', 'moderator', 'admin', 'super_admin');

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    username TEXT,
    avatar_url TEXT,
    steam_id VARCHAR,
    discord_id VARCHAR,
    telegram_chat_id BIGINT,
    balance NUMERIC DEFAULT 0,
    total_spent NUMERIC DEFAULT 0,
    is_veteran BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    banned_at TIMESTAMPTZ,
    banned_reason TEXT,
    birthday DATE,
    referral_code TEXT UNIQUE,
    referred_by UUID,
    email_news_enabled BOOLEAN DEFAULT true,
    email_promotions_enabled BOOLEAN DEFAULT true,
    email_order_updates_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL
);

-- Loyalty Levels
CREATE TABLE public.loyalty_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_spent NUMERIC DEFAULT 0,
    discount_percent NUMERIC DEFAULT 0,
    cashback_percent NUMERIC DEFAULT 0,
    icon TEXT DEFAULT '🥉',
    color TEXT DEFAULT '#CD7F32',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ORDER TABLES
-- ============================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    steam_id TEXT,
    total_amount NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_price NUMERIC NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT,
    product_price NUMERIC,
    quantity INTEGER DEFAULT 1,
    added_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PAYMENT TABLES
-- ============================================

CREATE TABLE public.balance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    payment_method TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_percent INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_order_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.promo_code_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id),
    user_id UUID NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    used_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- GAMIFICATION TABLES
-- ============================================

CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL,
    requirement_value INTEGER NOT NULL,
    reward_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id),
    unlocked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL,
    referred_id UUID NOT NULL,
    referral_code TEXT NOT NULL,
    bonus_given BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.daily_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    last_claim TIMESTAMPTZ DEFAULT now(),
    streak INTEGER DEFAULT 1,
    total_claimed NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.fortune_wheel_spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    prize_type TEXT NOT NULL,
    prize_value NUMERIC DEFAULT 0,
    spun_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.wishlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    target_price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- PROMO TABLES
-- ============================================

CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    discount_percent INTEGER NOT NULL,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    is_flash_sale BOOLEAN DEFAULT false,
    flash_title TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    product_ids TEXT[] DEFAULT '{}',
    discount_percent INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    bundle_price NUMERIC NOT NULL,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.bundle_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID NOT NULL REFERENCES public.product_bundles(id),
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.homepage_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT DEFAULT 'Детальніше',
    badge_text TEXT,
    badge_color TEXT DEFAULT 'primary',
    background_gradient TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- COMMUNICATION TABLES
-- ============================================

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE public.ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id),
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.broadcast_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all',
    status TEXT DEFAULT 'draft',
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

CREATE TABLE public.news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    image TEXT,
    category TEXT DEFAULT 'update',
    is_published BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.telegram_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    telegram_id BIGINT NOT NULL UNIQUE,
    telegram_username TEXT,
    verification_code TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all',
    status TEXT DEFAULT 'draft',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.birthday_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    promo_code_id UUID REFERENCES public.promo_codes(id),
    year INTEGER NOT NULL,
    sent_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

CREATE TABLE public.product_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    user_id UUID,
    session_id TEXT,
    source TEXT,
    viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    user_id UUID,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.viewed_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    old_price NUMERIC NOT NULL,
    new_price NUMERIC NOT NULL,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_unlimited BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    admin_id UUID,
    order_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ADMIN TABLES
-- ============================================

CREATE TABLE public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.cron_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    schedule TEXT NOT NULL,
    function_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    last_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    variant_a JSONB NOT NULL,
    variant_b JSONB NOT NULL,
    traffic_split INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT false,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.ab_tests(id),
    user_id UUID,
    session_id TEXT,
    variant TEXT NOT NULL,
    converted BOOLEAN DEFAULT false,
    conversion_value NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE public.rate_limit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    ip_address TEXT,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.edge_function_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.calculate_daily_bonus(current_streak INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    RETURN CASE
        WHEN current_streak >= 7 THEN 25
        WHEN current_streak = 6 THEN 18
        WHEN current_streak = 5 THEN 15
        WHEN current_streak = 4 THEN 12
        WHEN current_streak = 3 THEN 10
        WHEN current_streak = 2 THEN 7
        ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- END OF DUMP
-- ============================================
