
-- Create a function to safely get user type without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_type(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT user_type FROM profiles WHERE id = user_id);
END;
$$;

-- Fix the is_user_owner function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_user_owner(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use direct query without triggering RLS
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND user_type = 'owner'
  );
END;
$$;

-- Fix the can_request_approval function to avoid recursion
CREATE OR REPLACE FUNCTION public.can_request_approval(user_id UUID, location_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- A user can request approval if they own the location and they are an owner
  RETURN EXISTS (
    SELECT 1 FROM locations l
    WHERE l.id = location_id AND l.owner_id = user_id
  ) 
  AND 
  (SELECT user_type FROM profiles WHERE id = user_id) = 'owner';
END;
$$;
