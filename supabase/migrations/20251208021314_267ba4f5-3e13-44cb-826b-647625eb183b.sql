-- Create push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own subscriptions" 
ON public.push_subscriptions 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin can view all for sending notifications
CREATE POLICY "Admins can view all subscriptions" 
ON public.push_subscriptions 
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index
CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);