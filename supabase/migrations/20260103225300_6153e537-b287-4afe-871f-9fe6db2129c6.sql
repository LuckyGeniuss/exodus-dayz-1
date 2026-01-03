-- Create fortune wheel spins table
CREATE TABLE public.fortune_wheel_spins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_type TEXT NOT NULL, -- 'balance', 'discount', 'nothing'
  prize_value NUMERIC NOT NULL DEFAULT 0,
  spun_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spun_at)
);

-- Enable RLS
ALTER TABLE public.fortune_wheel_spins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own spins"
ON public.fortune_wheel_spins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spins"
ON public.fortune_wheel_spins FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to check if user can spin
CREATE OR REPLACE FUNCTION public.can_spin_fortune_wheel()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_last_spin TIMESTAMP WITH TIME ZONE;
  v_days_since_spin NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('can_spin', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get last spin
  SELECT spun_at INTO v_last_spin
  FROM public.fortune_wheel_spins
  WHERE user_id = v_user_id
  ORDER BY spun_at DESC
  LIMIT 1;
  
  IF v_last_spin IS NULL THEN
    RETURN json_build_object('can_spin', true, 'days_until_next', 0);
  END IF;
  
  v_days_since_spin := EXTRACT(EPOCH FROM (now() - v_last_spin)) / 86400;
  
  IF v_days_since_spin >= 7 THEN
    RETURN json_build_object('can_spin', true, 'days_until_next', 0);
  ELSE
    RETURN json_build_object('can_spin', false, 'days_until_next', CEIL(7 - v_days_since_spin));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to spin fortune wheel
CREATE OR REPLACE FUNCTION public.spin_fortune_wheel()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_can_spin JSON;
  v_random NUMERIC;
  v_prize_type TEXT;
  v_prize_value NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Check if can spin
  v_can_spin := public.can_spin_fortune_wheel();
  IF NOT (v_can_spin->>'can_spin')::boolean THEN
    RETURN json_build_object('success', false, 'error', 'Cannot spin yet', 'days_until_next', v_can_spin->>'days_until_next');
  END IF;
  
  -- Random prize selection (weighted)
  v_random := random();
  
  CASE
    WHEN v_random < 0.05 THEN -- 5% - 100₴
      v_prize_type := 'balance';
      v_prize_value := 100;
    WHEN v_random < 0.15 THEN -- 10% - 50₴
      v_prize_type := 'balance';
      v_prize_value := 50;
    WHEN v_random < 0.30 THEN -- 15% - 25₴
      v_prize_type := 'balance';
      v_prize_value := 25;
    WHEN v_random < 0.50 THEN -- 20% - 10₴
      v_prize_type := 'balance';
      v_prize_value := 10;
    WHEN v_random < 0.65 THEN -- 15% - 5₴
      v_prize_type := 'balance';
      v_prize_value := 5;
    WHEN v_random < 0.80 THEN -- 15% - 20% discount
      v_prize_type := 'discount';
      v_prize_value := 20;
    WHEN v_random < 0.90 THEN -- 10% - 10% discount
      v_prize_type := 'discount';
      v_prize_value := 10;
    ELSE -- 10% - nothing
      v_prize_type := 'nothing';
      v_prize_value := 0;
  END CASE;
  
  -- Record the spin
  INSERT INTO public.fortune_wheel_spins (user_id, prize_type, prize_value)
  VALUES (v_user_id, v_prize_type, v_prize_value);
  
  -- Apply prize
  IF v_prize_type = 'balance' THEN
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + v_prize_value
    WHERE id = v_user_id;
    
    INSERT INTO public.balance_transactions (user_id, amount, type, description, status)
    VALUES (v_user_id, v_prize_value, 'fortune_wheel', 'Виграш у колесі фортуни', 'completed');
    
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_user_id, 'reward', '🎰 Виграш!', 'Ви виграли ' || v_prize_value || '₴ у колесі фортуни!');
  ELSIF v_prize_type = 'discount' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (v_user_id, 'reward', '🎰 Знижка!', 'Ви виграли знижку ' || v_prize_value || '% на наступне замовлення!', 
      jsonb_build_object('discount_percent', v_prize_value));
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'prize_type', v_prize_type,
    'prize_value', v_prize_value
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;