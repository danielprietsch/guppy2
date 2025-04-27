

CREATE OR REPLACE FUNCTION public.fetch_professional_calendar_events(
  p_professional_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    json_build_object(
      'id', e.id,
      'professional_id', e.professional_id,
      'title', e.title,
      'description', e.description,
      'start_time', e.start_time,
      'end_time', e.end_time,
      'event_type', e.event_type,
      'status', e.status,
      'color', e.color
    )
  FROM
    professional_calendar_events e
  WHERE
    e.professional_id = p_professional_id
    AND e.start_time >= p_start_date
    AND e.start_time <= p_end_date
  ORDER BY
    e.start_time;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fetch_professional_calendar_events TO authenticated;
