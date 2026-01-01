-- Create admin settings table for API keys management
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  description text,
  is_encrypted boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings" ON public.admin_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings entries for all services
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('STEAM_API_KEY', '', 'Steam Web API ключ для отримання даних користувачів'),
  ('WAYFORPAY_MERCHANT_ACCOUNT', '', 'Merchant Account для Wayforpay'),
  ('WAYFORPAY_SECRET_KEY', '', 'Secret Key для Wayforpay'),
  ('NOWPAYMENTS_API_KEY', '', 'API ключ для NOWPayments крипто платежів'),
  ('NOWPAYMENTS_IPN_SECRET', '', 'IPN Secret для NOWPayments вебхуків'),
  ('RESEND_API_KEY', '', 'API ключ для Resend email сервісу'),
  ('DISCORD_WEBHOOK_URL', '', 'Discord Webhook URL для сповіщень');

-- Create product_images table for gallery
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view product images
CREATE POLICY "Anyone can view product images" ON public.product_images
FOR SELECT USING (true);

-- Admins can manage product images
CREATE POLICY "Admins can manage product images" ON public.product_images
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));