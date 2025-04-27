
-- Create professional_calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.professional_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row-Level Security
ALTER TABLE public.professional_calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Professionals can view their own calendar events"
  ON public.professional_calendar_events
  FOR SELECT
  USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can insert their own calendar events"
  ON public.professional_calendar_events
  FOR INSERT
  WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Professionals can update their own calendar events"
  ON public.professional_calendar_events
  FOR UPDATE
  USING (auth.uid() = professional_id);

CREATE POLICY "Professionals can delete their own calendar events"
  ON public.professional_calendar_events
  FOR DELETE
  USING (auth.uid() = professional_id);
