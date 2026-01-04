-- ============================================
-- 1. PRODUCT BUNDLES (Бандли/Набори товарів)
-- ============================================

-- Table for bundles
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  bundle_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bundle items (products in bundle)
CREATE TABLE public.bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Anyone can view active bundles" ON public.product_bundles
  FOR SELECT USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage bundles" ON public.product_bundles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view bundle items" ON public.bundle_items
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage bundle items" ON public.bundle_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 2. INVENTORY MANAGEMENT (Управління складом)
-- ============================================

-- Product inventory
CREATE TABLE public.product_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_unlimited BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory history log
CREATE TABLE public.inventory_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  admin_id UUID,
  order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view inventory" ON public.product_inventory
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage inventory" ON public.product_inventory
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view inventory logs" ON public.inventory_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert inventory logs" ON public.inventory_logs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 3. PRICE HISTORY (Історія цін)
-- ============================================

CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  changed_by UUID
);

-- Price alerts (підписка на зниження ціни)
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view price history" ON public.price_history
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage price history" ON public.price_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own price alerts" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. CHANGELOG/NEWS (Новини та оновлення)
-- ============================================

CREATE TABLE public.news_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  image TEXT,
  category TEXT NOT NULL DEFAULT 'update',
  is_published BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  author_id UUID NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published news" ON public.news_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage news" ON public.news_posts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 5. PRODUCT ANALYTICS (Аналітика товарів)
-- ============================================

CREATE TABLE public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT
);

CREATE TABLE public.product_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_clicks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert product views" ON public.product_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view product analytics" ON public.product_views
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert product clicks" ON public.product_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view product clicks" ON public.product_clicks
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- 6. REALTIME - Enable for orders
-- ============================================

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;