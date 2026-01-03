-- Create loyalty levels table
CREATE TABLE public.loyalty_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_spent numeric NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  cashback_percent numeric NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT '🥉',
  color text NOT NULL DEFAULT '#CD7F32',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loyalty_levels ENABLE ROW LEVEL SECURITY;

-- Anyone can view loyalty levels
CREATE POLICY "Anyone can view loyalty levels"
ON public.loyalty_levels FOR SELECT
USING (true);

-- Admins can manage loyalty levels
CREATE POLICY "Admins can manage loyalty levels"
ON public.loyalty_levels FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add total_spent to profiles for tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0;

-- Insert default loyalty levels
INSERT INTO public.loyalty_levels (name, min_spent, discount_percent, cashback_percent, icon, color) VALUES
  ('Новачок', 0, 0, 1, '🥉', '#CD7F32'),
  ('Бронза', 500, 2, 2, '🥉', '#CD7F32'),
  ('Срібло', 2000, 5, 3, '🥈', '#C0C0C0'),
  ('Золото', 5000, 8, 5, '🥇', '#FFD700'),
  ('Платина', 10000, 12, 7, '💎', '#E5E4E2'),
  ('Діамант', 25000, 15, 10, '💎', '#B9F2FF');

-- Create function to update total_spent and give cashback
CREATE OR REPLACE FUNCTION public.process_order_completion()
RETURNS TRIGGER AS $$
DECLARE
  cashback_amount numeric;
  level_cashback numeric;
BEGIN
  -- Only process when status changes to completed
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update total spent
    UPDATE public.profiles
    SET total_spent = COALESCE(total_spent, 0) + NEW.final_amount
    WHERE id = NEW.user_id;
    
    -- Get user's loyalty level cashback
    SELECT COALESCE(ll.cashback_percent, 0) INTO level_cashback
    FROM public.profiles p
    LEFT JOIN public.loyalty_levels ll ON p.total_spent >= ll.min_spent
    WHERE p.id = NEW.user_id
    ORDER BY ll.min_spent DESC
    LIMIT 1;
    
    -- Calculate and give cashback
    IF level_cashback > 0 THEN
      cashback_amount := NEW.final_amount * (level_cashback / 100);
      
      UPDATE public.profiles
      SET balance = COALESCE(balance, 0) + cashback_amount
      WHERE id = NEW.user_id;
      
      -- Log cashback transaction
      INSERT INTO public.balance_transactions (user_id, amount, type, description, status)
      VALUES (NEW.user_id, cashback_amount, 'cashback', 'Кешбек за замовлення #' || LEFT(NEW.id::text, 8), 'completed');
    END IF;
    
    -- Create notification for order completion
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'order_status',
      'Замовлення оплачено',
      'Ваше замовлення #' || LEFT(NEW.id::text, 8) || ' успішно оплачено!',
      jsonb_build_object('order_id', NEW.id)
    );
  END IF;
  
  -- Notify on status change to failed
  IF NEW.payment_status = 'failed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'failed') THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.user_id,
      'order_status',
      'Помилка оплати',
      'На жаль, оплата замовлення #' || LEFT(NEW.id::text, 8) || ' не вдалась. Спробуйте ще раз.',
      jsonb_build_object('order_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order status changes
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_order_completion();

-- Create function for promo code notification
CREATE OR REPLACE FUNCTION public.notify_promo_code_use()
RETURNS TRIGGER AS $$
DECLARE
  promo_discount integer;
  promo_code_text text;
BEGIN
  -- Get promo code details
  SELECT discount_percent, code INTO promo_discount, promo_code_text
  FROM public.promo_codes
  WHERE id = NEW.promo_code_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'promo_code',
    'Промокод активовано',
    'Ви використали промокод ' || promo_code_text || ' зі знижкою ' || promo_discount || '%',
    jsonb_build_object('promo_code_id', NEW.promo_code_id, 'discount', promo_discount)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for promo code use
DROP TRIGGER IF EXISTS on_promo_code_use ON public.promo_code_uses;
CREATE TRIGGER on_promo_code_use
  AFTER INSERT ON public.promo_code_uses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_promo_code_use();

-- Create function for achievement notification
CREATE OR REPLACE FUNCTION public.notify_achievement_unlock()
RETURNS TRIGGER AS $$
DECLARE
  achievement_name text;
  achievement_reward numeric;
BEGIN
  -- Get achievement details
  SELECT name, reward_balance INTO achievement_name, achievement_reward
  FROM public.achievements
  WHERE id = NEW.achievement_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'achievement',
    'Нове досягнення!',
    'Ви отримали досягнення "' || achievement_name || '"' || 
    CASE WHEN achievement_reward > 0 THEN ' та бонус ' || achievement_reward || ' ₴ на баланс!' ELSE '!' END,
    jsonb_build_object('achievement_id', NEW.achievement_id, 'reward', achievement_reward)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for achievement unlock
DROP TRIGGER IF EXISTS on_achievement_unlock ON public.user_achievements;
CREATE TRIGGER on_achievement_unlock
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_achievement_unlock();

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at_status ON public.orders(created_at, payment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_created ON public.promo_code_uses(used_at);
CREATE INDEX IF NOT EXISTS idx_profiles_total_spent ON public.profiles(total_spent DESC);