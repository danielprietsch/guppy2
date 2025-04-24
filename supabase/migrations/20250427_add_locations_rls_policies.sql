
-- This migration was superseded by 20250428_fix_locations_rls.sql
-- Keeping for historical purposes only

-- Original policies (no longer active)
/*
-- Create new RLS policy to allow owner user type to create and access their locations
CREATE POLICY "Owners can create their own locations"
ON public.locations
FOR ALL
USING (auth.uid() = owner_id);

-- Add policy to allow viewing approved locations
CREATE POLICY "Anyone can view approved locations"
ON public.locations
FOR SELECT
USING (approval_status = 'approved' AND active = true);
*/
