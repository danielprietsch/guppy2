
-- Create a database function to get owner locations without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_owner_locations(owner_user_id UUID)
RETURNS TABLE(
  id UUID,
  owner_id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  opening_hours JSONB,
  amenities JSONB,
  cabins_count INTEGER,
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
    l.owner_id,
    l.name,
    l.address,
    l.city,
    l.state,
    l.zip_code,
    l.opening_hours,
    l.amenities,
    l.cabins_count,
    l.image_url,
    l.description,
    l.active
  FROM locations l
  WHERE l.owner_id = owner_user_id;
END;
$$;
