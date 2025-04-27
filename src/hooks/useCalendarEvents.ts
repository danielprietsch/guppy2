
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

      try {
        console.log('Fetching events for professional:', professionalId);
        console.log('Date range:', weekStart.toISOString(), 'to', weekEnd.toISOString());
        
        // Use the raw Supabase query with proper typing
        const { data, error } = await supabase
          .rpc(
            'fetch_professional_calendar_events', // Removed type assertion
            {
              p_professional_id: professionalId,
              p_start_date: weekStart.toISOString(),
              p_end_date: weekEnd.toISOString()
            }
          );

        if (error) {
          console.error('Error fetching calendar events:', error);
          throw error;
        }
        
        console.log('Events data returned:', data);
        
        // Parse the JSON results into our CalendarEvent type
        if (!data) return [];
        
        return Array.isArray(data) ? data.map(item => {
          // If item is a string (JSON string), parse it
          const eventData = typeof item === 'string' ? JSON.parse(item) : item;
          return eventData as CalendarEvent;
        }) : [];
      } catch (err) {
        console.error('Error in calendar events query:', err);
        return [];
      }
    },
    enabled: !!professionalId,
  });

  return {
    events,
    isLoading,
    error
  };
}
