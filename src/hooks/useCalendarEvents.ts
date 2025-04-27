
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: 'appointment' | 'booking' | 'availability_block' | 'personal';
  status: 'confirmed' | 'tentative' | 'cancelled';
  color?: string;
}

export function useCalendarEvents(professionalId: string | undefined, selectedDate: Date) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar-events', professionalId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!professionalId) return [];

      const { data, error } = await supabase
        .from('professional_calendar_events')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString())
        .order('start_time');

      if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }

      return data as CalendarEvent[];
    },
    enabled: !!professionalId,
  });

  return {
    events,
    isLoading,
    error
  };
}
