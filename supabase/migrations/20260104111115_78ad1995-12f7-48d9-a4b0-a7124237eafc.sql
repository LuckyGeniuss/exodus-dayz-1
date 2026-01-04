-- Add email notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_promotions_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_order_updates_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_news_enabled BOOLEAN DEFAULT true;

-- Create table for notification logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipients_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage notification logs
CREATE POLICY "Admins can manage notification logs"
ON public.notification_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for cron job management
CREATE TABLE IF NOT EXISTS public.cron_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  schedule TEXT NOT NULL,
  function_name TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage cron jobs
CREATE POLICY "Admins can manage cron jobs"
ON public.cron_jobs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the existing cron job record
INSERT INTO public.cron_jobs (name, description, schedule, function_name, is_enabled)
VALUES (
  'notify-ending-promotions-job',
  'Сповіщення про акції, що закінчуються протягом 24 годин',
  '0 */6 * * *',
  'notify-ending-promotions',
  true
) ON CONFLICT (name) DO NOTHING;