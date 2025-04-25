
-- Add a function to force profile refresh via realtime
CREATE OR REPLACE FUNCTION public.force_refresh_profile(profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just update the updated_at timestamp to trigger realtime events
  UPDATE public.profiles
  SET updated_at = now()
  WHERE id = profile_id;
  
  -- Return success
  RETURN FOUND;
END;
$$;

-- Make sure profiles table has realtime enabled with full replica identity
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add profiles to realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END
$$;
