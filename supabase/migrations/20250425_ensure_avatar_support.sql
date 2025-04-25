
-- Create a public bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

-- Create policies for avatar management
DO $$
BEGIN
  -- Avatar upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow users to upload their own avatars'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow users to upload their own avatars"
    ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- Avatar update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow users to update their own avatars'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow users to update their own avatars"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- Avatar delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow users to delete their own avatars'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow users to delete their own avatars"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- Avatar public read policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow public to read avatars'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Allow public to read avatars"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');
  END IF;
END
$$;

-- Add or update the function to synchronize avatar updates
CREATE OR REPLACE FUNCTION public.update_avatar_everywhere(
  user_id uuid,
  avatar_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Update the profile record
  UPDATE public.profiles
  SET 
    avatar_url = update_avatar_everywhere.avatar_url,
    updated_at = now()
  WHERE id = user_id;
  
  -- Update user metadata in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('avatar_url', avatar_url)
        ELSE
          raw_user_meta_data || jsonb_build_object('avatar_url', avatar_url)
      END
  WHERE id = user_id;
  
  RETURN true;
END;
$$;

-- Make sure profiles table supports realtime subscriptions
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add profiles to realtime publication if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END
$$;
