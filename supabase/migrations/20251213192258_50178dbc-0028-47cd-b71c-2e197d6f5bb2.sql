-- Create promo_codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for tracking promo code usage per user
CREATE TABLE public.promo_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_uses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes" 
ON public.promo_codes 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Admins can manage promo codes" 
ON public.promo_codes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for promo_code_uses
CREATE POLICY "Users can view own promo code uses" 
ON public.promo_code_uses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own promo code uses" 
ON public.promo_code_uses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all promo code uses" 
ON public.promo_code_uses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert some sample promo codes
INSERT INTO public.promo_codes (code, discount_percent, max_uses, min_order_amount, valid_until) VALUES
('EXODUS10', 10, 100, 100, now() + interval '30 days'),
('NEWPLAYER', 15, 50, 0, now() + interval '14 days'),
('VIP20', 20, 20, 500, now() + interval '7 days');