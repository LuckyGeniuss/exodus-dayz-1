-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  bonus_given BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referred_id);

-- Create index
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Function to generate referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::text || NOW()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate referral code
CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();