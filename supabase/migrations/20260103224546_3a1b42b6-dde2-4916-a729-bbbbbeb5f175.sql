-- Create daily_rewards table for daily bonus system
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_claim TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  streak INTEGER NOT NULL DEFAULT 1,
  total_claimed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily rewards"
ON public.daily_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily rewards"
ON public.daily_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily rewards"
ON public.daily_rewards FOR UPDATE
USING (auth.uid() = user_id);

-- Function to calculate daily bonus based on streak
CREATE OR REPLACE FUNCTION public.calculate_daily_bonus(current_streak INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- Base bonus: 5₴, increases with streak
  -- Day 1: 5₴, Day 2: 7₴, Day 3: 10₴, Day 4: 15₴, Day 5: 20₴, Day 6: 30₴, Day 7+: 50₴
  CASE current_streak
    WHEN 1 THEN RETURN 5;
    WHEN 2 THEN RETURN 7;
    WHEN 3 THEN RETURN 10;
    WHEN 4 THEN RETURN 15;
    WHEN 5 THEN RETURN 20;
    WHEN 6 THEN RETURN 30;
    ELSE RETURN 50;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- Function to claim daily bonus
CREATE OR REPLACE FUNCTION public.claim_daily_bonus()
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_bonus NUMERIC;
  v_hours_since_claim NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Get current daily reward record
  SELECT last_claim, streak INTO v_last_claim, v_current_streak
  FROM public.daily_rewards
  WHERE user_id = v_user_id;
  
  IF v_last_claim IS NOT NULL THEN
    v_hours_since_claim := EXTRACT(EPOCH FROM (now() - v_last_claim)) / 3600;
    
    -- Check if already claimed today (less than 20 hours ago)
    IF v_hours_since_claim < 20 THEN
      RETURN json_build_object('success', false, 'error', 'Already claimed today', 'hours_until_next', 20 - v_hours_since_claim);
    END IF;
    
    -- Check if streak should continue or reset (more than 48 hours = reset)
    IF v_hours_since_claim > 48 THEN
      v_new_streak := 1;
    ELSE
      v_new_streak := LEAST(v_current_streak + 1, 7);
    END IF;
  ELSE
    v_new_streak := 1;
  END IF;
  
  -- Calculate bonus
  v_bonus := public.calculate_daily_bonus(v_new_streak);
  
  -- Upsert daily reward record
  INSERT INTO public.daily_rewards (user_id, last_claim, streak, total_claimed)
  VALUES (v_user_id, now(), v_new_streak, v_bonus)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_claim = now(),
    streak = v_new_streak,
    total_claimed = public.daily_rewards.total_claimed + v_bonus;
  
  -- Add balance to user profile
  UPDATE public.profiles
  SET balance = balance + v_bonus
  WHERE id = v_user_id;
  
  -- Create balance transaction
  INSERT INTO public.balance_transactions (user_id, amount, type, description, status)
  VALUES (v_user_id, v_bonus, 'daily_bonus', 'Щоденний бонус (день ' || v_new_streak || ')', 'completed');
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (v_user_id, 'Щоденний бонус!', 'Ви отримали ' || v_bonus || '₴ за день ' || v_new_streak || ' серії!', 'reward');
  
  RETURN json_build_object(
    'success', true,
    'bonus', v_bonus,
    'streak', v_new_streak,
    'message', 'Ви отримали ' || v_bonus || '₴!'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;