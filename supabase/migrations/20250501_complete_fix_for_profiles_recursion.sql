
-- First ensure all problematic RLS policies are gone
DROP POLICY IF EXISTS "Allow all profile access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Global admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Global admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create direct access policies without any recursive checking
-- Allow authenticated users to select ANY profile
CREATE POLICY "Anyone can view any profile" 
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to update only their own profile via direct id comparison
CREATE POLICY "Users can update own profile by id" 
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile with id check
CREATE POLICY "Users can insert their own profile" 
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Keep RLS enabled with these safe policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a standalone function to check user type safely
CREATE OR REPLACE FUNCTION public.is_user_type(user_id UUID, user_type_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND user_type = user_type_to_check
  );
END;
$$;
