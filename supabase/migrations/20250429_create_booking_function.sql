
-- Create a function to safely create bookings without RLS recursion
CREATE OR REPLACE FUNCTION public.create_booking(
  cabin_id UUID,
  professional_id UUID,
  date DATE,
  shift TEXT,
  price NUMERIC,
  status TEXT DEFAULT 'payment_pending'
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO bookings (cabin_id, professional_id, date, shift, price, status)
  VALUES (cabin_id, professional_id, date, shift, price, status)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
