
-- First, check and enable RLS on locations table if not already enabled
ALTER TABLE IF EXISTS public.locations ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting policies to ensure fresh ones
DROP POLICY IF EXISTS "Owners can manage their own locations" ON public.locations;
DROP POLICY IF EXISTS "Owners can create their own locations" ON public.locations;
DROP POLICY IF EXISTS "Anyone can view approved locations" ON public.locations;

-- Create policy for allowing owners to manage their own locations
CREATE POLICY "Owners can manage their own locations"
ON public.locations
FOR ALL
USING (auth.uid() = owner_id);

-- Add policy to allow viewing approved locations
CREATE POLICY "Anyone can view approved locations"
ON public.locations
FOR SELECT
USING (approval_status = 'approved' AND active = true);
