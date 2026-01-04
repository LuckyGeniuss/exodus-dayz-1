
-- Add birthday field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Create birthday coupons table
CREATE TABLE IF NOT EXISTS public.birthday_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Unique constraint: one coupon per user per year
ALTER TABLE public.birthday_coupons ADD CONSTRAINT unique_birthday_coupon_per_year UNIQUE (user_id, year);

-- Enable RLS
ALTER TABLE public.birthday_coupons ENABLE ROW LEVEL SECURITY;

-- RLS policies for birthday_coupons
CREATE POLICY "Users can view their own birthday coupons"
  ON public.birthday_coupons FOR SELECT
  USING (auth.uid() = user_id);

-- Create homepage banners table
CREATE TABLE IF NOT EXISTS public.homepage_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Детальніше',
  badge_text TEXT,
  badge_color TEXT DEFAULT 'primary',
  background_gradient TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for banners (public read)
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active banners"
  ON public.homepage_banners FOR SELECT
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date > now()));

CREATE POLICY "Admins can manage banners"
  ON public.homepage_banners FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create flash sales table (enhanced promotions)
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  product_ids UUID[] NOT NULL DEFAULT '{}',
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active flash sales"
  ON public.flash_sales FOR SELECT
  USING (is_active = true AND start_date <= now() AND end_date > now());

CREATE POLICY "Admins can manage flash sales"
  ON public.flash_sales FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create A/B tests table
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  traffic_split INTEGER DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
  is_active BOOLEAN DEFAULT false,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AB tests"
  ON public.ab_tests FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create AB test results table
CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  converted BOOLEAN DEFAULT false,
  conversion_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view AB test results"
  ON public.ab_test_results FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create email campaigns table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email campaigns"
  ON public.email_campaigns FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Insert default banners
INSERT INTO public.homepage_banners (title, subtitle, badge_text, badge_color, background_gradient, link_url, link_text, display_order) VALUES
('🎮 Літній розпродаж!', 'Знижки до 50% на всі товари', '-50%', 'destructive', 'from-orange-500 via-red-500 to-pink-500', '/products', 'До товарів', 1),
('🎁 Вигідні набори', 'Збірки товарів за спеціальними цінами', 'Економія', 'secondary', 'from-blue-600 via-purple-600 to-indigo-600', '/bundles', 'Переглянути', 2),
('⭐ VIP-статус', 'Ексклюзивні бонуси для постійних клієнтів', 'VIP', 'default', 'from-amber-500 via-yellow-500 to-orange-400', '/profile', 'Дізнатись більше', 3),
('🎂 День народження?', 'Отримайте персональну знижку у свій особливий день!', 'Бонус', 'outline', 'from-pink-500 via-rose-500 to-red-500', '/profile', 'Вказати дату', 4);

-- Function to generate birthday promo code
CREATE OR REPLACE FUNCTION public.generate_birthday_promo()
RETURNS TRIGGER AS $$
DECLARE
  v_promo_code TEXT;
  v_promo_id UUID;
BEGIN
  -- Only trigger if birthday is set and it's their birthday today
  IF NEW.birthday IS NOT NULL AND 
     EXTRACT(MONTH FROM NEW.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) AND
     EXTRACT(DAY FROM NEW.birthday) = EXTRACT(DAY FROM CURRENT_DATE) THEN
    
    -- Check if already has coupon this year
    IF EXISTS (
      SELECT 1 FROM public.birthday_coupons 
      WHERE user_id = NEW.id AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Generate unique promo code
    v_promo_code := 'BDAY' || UPPER(SUBSTRING(MD5(NEW.id::text || CURRENT_DATE::text) FROM 1 FOR 6));
    
    -- Create promo code with 20% discount
    INSERT INTO public.promo_codes (code, discount_percent, max_uses, valid_from, valid_until, is_active)
    VALUES (v_promo_code, 20, 1, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', true)
    RETURNING id INTO v_promo_id;
    
    -- Record birthday coupon
    INSERT INTO public.birthday_coupons (user_id, promo_code_id, year)
    VALUES (NEW.id, v_promo_id, EXTRACT(YEAR FROM CURRENT_DATE));
    
    -- Create notification
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.id,
      'birthday',
      '🎂 З Днем народження!',
      'Ми підготували для вас подарунок - персональна знижка 20%! Промокод: ' || v_promo_code || ' (дійсний 7 днів)',
      jsonb_build_object('promo_code', v_promo_code, 'discount', 20)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for birthday check (runs on profile update)
DROP TRIGGER IF EXISTS check_birthday_trigger ON public.profiles;
CREATE TRIGGER check_birthday_trigger
  AFTER UPDATE OF birthday ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_birthday_promo();
