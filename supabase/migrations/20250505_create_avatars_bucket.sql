
-- Create avatars bucket if it doesn't exist
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM storage.buckets WHERE id = 'avatars'
  ) INTO bucket_exists;

  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets
      (id, name, public)
    VALUES
      ('avatars', 'avatars', TRUE);

    -- Create policy to allow users to read all avatars
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Avatar Read Policy',
      '(bucket_id = ''avatars''::text)',
      'avatars'
    );

    -- Create policy to allow users to upload their own avatars
    INSERT INTO storage.policies (name, definition, bucket_id)
    VALUES (
      'Avatar Upload Policy',
      '(bucket_id = ''avatars''::text AND auth.uid()::text = (storage.foldername(name))[1])',
      'avatars'
    );
  END IF;
END $$;
