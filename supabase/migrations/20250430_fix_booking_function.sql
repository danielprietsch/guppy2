
-- Modify the create_booking function to avoid any profile queries for validation
CREATE OR REPLACE FUNCTION public.create_booking(
  cabin_id UUID, 
  professional_id UUID, 
  date DATE, 
  shift TEXT, 
  price NUMERIC, 
  status TEXT DEFAULT 'payment_pending'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_id UUID;
BEGIN
  -- No validation checks that could trigger profile queries
  -- Just directly insert the booking
  INSERT INTO bookings (cabin_id, professional_id, date, shift, price, status)
  VALUES (cabin_id, professional_id, date, shift, price, status)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to safely get a user's type without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_type(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (SELECT user_type FROM profiles WHERE id = user_id);
END;
$$;
