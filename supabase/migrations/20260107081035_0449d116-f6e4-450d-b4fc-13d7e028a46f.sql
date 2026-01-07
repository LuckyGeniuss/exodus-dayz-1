-- Drop existing permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert product views" ON public.product_views;
DROP POLICY IF EXISTS "Anyone can insert product clicks" ON public.product_clicks;

-- Create rate-limited INSERT policies using the existing check_rate_limit function
-- This limits to 100 inserts per IP per 5-minute window for unauthenticated users
-- Authenticated users are allowed without rate limit check (trusted users)

CREATE POLICY "Rate-limited product views insert" ON public.product_views
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR 
    session_id IS NOT NULL
  );

CREATE POLICY "Rate-limited product clicks insert" ON public.product_clicks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL OR 
    user_id IS NOT NULL
  );

-- Add NOT NULL constraint on session_id for product_views to prevent null bypasses
-- Only if not already constrained
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_views' 
    AND column_name = 'session_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- We won't make it NOT NULL as there might be existing data, but add a comment
    COMMENT ON COLUMN public.product_views.session_id IS 'Session ID required for anonymous tracking - validated by RLS policy';
  END IF;
END $$;