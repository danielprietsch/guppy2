
-- Fix for infinite recursion in RLS policies with profiles table
-- This function will check if a user has owner type without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_user_owner(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First check user_type from profiles without triggering RLS
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND user_type = 'owner'
  );
END;
$$;

-- Add another function to check if a user can request approvals
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
  public.is_user_owner(user_id);
END;
$$;
