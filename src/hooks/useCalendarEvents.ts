import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, addMinutes } from 'date-fns';

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

export interface TimeSlot {
  time: Date;
  events: CalendarEvent[];
  status: 'free' | 'busy' | 'lunch' | 'outside';
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
        
        const { data, error } = await supabase
          .rpc(
            'fetch_professional_calendar_events',
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
        
        if (!data) return [];
        
        return Array.isArray(data) ? data.map(item => {
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

  // Function to generate time slots for a day
  const generateTimeSlots = (date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startTime = new Date(date);
    startTime.setHours(0, 0, 0, 0);

    for (let i = 0; i < 96; i++) {
      const slotTime = addMinutes(startTime, i * 15);
      slots.push({
        time: slotTime,
        events: events.filter(event => {
          const eventStart = new Date(event.start_time);
          const eventEnd = new Date(event.end_time);
          return slotTime >= eventStart && slotTime < eventEnd;
        }),
        status: 'free'
      });
    }

    return slots;
  };

  return {
    events,
    isLoading,
    error,
    generateTimeSlots
  };
}
