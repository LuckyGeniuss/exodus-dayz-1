-- Create notifications table for user notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL, -- 'order_status', 'promo_code', 'achievement', 'system'
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  data jsonb, -- Additional data like order_id, promo_code, etc.
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
ON public.notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add shop settings if not exist
INSERT INTO public.admin_settings (key, value, description, is_encrypted)
VALUES 
  ('veteran_discount_percent', '10', 'Знижка для ветеранів (%)', false),
  ('cashback_percent', '5', 'Відсоток кешбеку', false),
  ('min_order_amount', '0', 'Мінімальна сума замовлення (₴)', false),
  ('max_order_amount', '100000', 'Максимальна сума замовлення (₴)', false),
  ('shop_banner_text', '', 'Текст банера для покупців', false),
  ('shop_banner_enabled', 'false', 'Показувати банер', false)
ON CONFLICT (key) DO NOTHING;