
-- Create a database function to get approval status without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_location_approval_status(loc_id UUID)
RETURNS TABLE(id UUID, status TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.status
  FROM admin_approvals a
  WHERE a.location_id = loc_id;
END;
$$;
