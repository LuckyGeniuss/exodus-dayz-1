-- Add is_flash_sale and flash_end_date to promotions for flash sales
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS is_flash_sale boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flash_title text DEFAULT NULL;

-- Create function to process referral bonuses on first purchase
CREATE OR REPLACE FUNCTION public.process_referral_bonus()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_record RECORD;
  referral_bonus numeric := 50; -- 50₴ for both
BEGIN
  -- Only process when order status changes to completed
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    -- Check if this is user's first completed order
    IF (SELECT COUNT(*) FROM orders WHERE user_id = NEW.user_id AND payment_status = 'completed' AND id != NEW.id) = 0 THEN
      -- Check if user was referred
      SELECT r.* INTO referral_record
      FROM referrals r
      WHERE r.referred_id = NEW.user_id AND r.bonus_given = false;
      
      IF FOUND THEN
        -- Give bonus to referrer
        UPDATE profiles 
        SET balance = COALESCE(balance, 0) + referral_bonus
        WHERE id = referral_record.referrer_id;
        
        -- Give bonus to referred user
        UPDATE profiles 
        SET balance = COALESCE(balance, 0) + referral_bonus
        WHERE id = NEW.user_id;
        
        -- Mark referral as bonus given
        UPDATE referrals 
        SET bonus_given = true
        WHERE id = referral_record.id;
        
        -- Create transaction for referrer
        INSERT INTO balance_transactions (user_id, amount, type, description, status)
        VALUES (referral_record.referrer_id, referral_bonus, 'referral_bonus', 'Реферальний бонус за запрошення друга', 'completed');
        
        -- Create transaction for referred
        INSERT INTO balance_transactions (user_id, amount, type, description, status)
        VALUES (NEW.user_id, referral_bonus, 'referral_bonus', 'Бонус за реєстрацію по реферальному посиланню', 'completed');
        
        -- Create notification for referrer
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          referral_record.referrer_id,
          'referral_bonus',
          '🎉 Реферальний бонус!',
          'Ваш друг здійснив першу покупку! Ви отримали ' || referral_bonus || '₴ на баланс!',
          jsonb_build_object('referred_id', NEW.user_id, 'bonus', referral_bonus)
        );
        
        -- Create notification for referred user
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          NEW.user_id,
          'referral_bonus',
          '🎁 Бонус за реєстрацію!',
          'Вітаємо з першою покупкою! Ви отримали ' || referral_bonus || '₴ реферального бонусу!',
          jsonb_build_object('referrer_id', referral_record.referrer_id, 'bonus', referral_bonus)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for referral bonus processing
DROP TRIGGER IF EXISTS on_order_referral_bonus ON public.orders;
CREATE TRIGGER on_order_referral_bonus
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_bonus();

-- Also trigger on insert for orders that are immediately completed
CREATE OR REPLACE FUNCTION public.process_referral_bonus_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_record RECORD;
  referral_bonus numeric := 50;
BEGIN
  IF NEW.payment_status = 'completed' THEN
    -- Check if this is user's first completed order
    IF (SELECT COUNT(*) FROM orders WHERE user_id = NEW.user_id AND payment_status = 'completed' AND id != NEW.id) = 0 THEN
      SELECT r.* INTO referral_record
      FROM referrals r
      WHERE r.referred_id = NEW.user_id AND r.bonus_given = false;
      
      IF FOUND THEN
        UPDATE profiles SET balance = COALESCE(balance, 0) + referral_bonus WHERE id = referral_record.referrer_id;
        UPDATE profiles SET balance = COALESCE(balance, 0) + referral_bonus WHERE id = NEW.user_id;
        UPDATE referrals SET bonus_given = true WHERE id = referral_record.id;
        
        INSERT INTO balance_transactions (user_id, amount, type, description, status)
        VALUES (referral_record.referrer_id, referral_bonus, 'referral_bonus', 'Реферальний бонус за запрошення друга', 'completed');
        
        INSERT INTO balance_transactions (user_id, amount, type, description, status)
        VALUES (NEW.user_id, referral_bonus, 'referral_bonus', 'Бонус за реєстрацію по реферальному посиланню', 'completed');
        
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (referral_record.referrer_id, 'referral_bonus', '🎉 Реферальний бонус!', 'Ваш друг здійснив першу покупку! Ви отримали ' || referral_bonus || '₴ на баланс!', jsonb_build_object('referred_id', NEW.user_id, 'bonus', referral_bonus));
        
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (NEW.user_id, 'referral_bonus', '🎁 Бонус за реєстрацію!', 'Вітаємо з першою покупкою! Ви отримали ' || referral_bonus || '₴ реферального бонусу!', jsonb_build_object('referrer_id', referral_record.referrer_id, 'bonus', referral_bonus));
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_referral_bonus_insert ON public.orders;
CREATE TRIGGER on_order_referral_bonus_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_bonus_insert();