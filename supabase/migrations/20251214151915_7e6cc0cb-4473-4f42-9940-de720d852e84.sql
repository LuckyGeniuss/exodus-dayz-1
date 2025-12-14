-- Add discord_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_id character varying;

-- Update RLS policy for profiles to allow updating discord_id (already exists via update own profile)
