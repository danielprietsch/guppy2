
-- Create a function to safely get owner locations without RLS recursion
CREATE OR REPLACE FUNCTION public.get_owner_locations(owner_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  cabins_count INT,
  opening_hours JSONB,
  amenities TEXT[],
  image_url TEXT,
  description TEXT,
  active BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.address,
    l.city,
    l.state,
    l.zip_code,
    l.cabins_count,
    l.opening_hours,
    l.amenities,
    l.image_url,
    l.description,
    l.active
  FROM locations l
  WHERE l.owner_id = owner_user_id;
END;
$$;

-- Fix the check_owner_status function to return the correct columns
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
