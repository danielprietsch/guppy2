
-- Create a database function to check if a user is an owner without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.check_owner_status(user_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  user_type TEXT,
  phone_number TEXT,
  avatar_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email,
    p.user_type,
    p.phone_number,
    p.avatar_url
  FROM profiles p
  WHERE p.id = user_id AND p.user_type = 'owner';
END;
$$;
