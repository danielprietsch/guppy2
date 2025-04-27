
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export interface CalendarEvent {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: 'appointment' | 'booking' | 'availability_block';
  status: 'confirmed' | 'tentative' | 'cancelled';
  color?: string;
}

export function useCalendarEvents(professionalId: string | undefined, selectedDate: Date) {
  const queryClient = useQueryClient();
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

  const toggleSlotAvailability = async (slotDate: Date) => {
    if (!professionalId) return;

    const endDate = new Date(slotDate);
    endDate.setMinutes(endDate.getMinutes() + 15);

    try {
      const { data: existingBlock, error: fetchError } = await supabase
        .from('professional_calendar_events')
        .select()
        .eq('professional_id', professionalId)
        .eq('event_type', 'availability_block')
        .gte('start_time', slotDate.toISOString())
        .lt('end_time', endDate.toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking availability block:', fetchError);
        return;
      }

      if (existingBlock) {
        // Remove the availability block
        const { error: deleteError } = await supabase
          .from('professional_calendar_events')
          .delete()
          .eq('id', existingBlock.id);

        if (deleteError) {
          console.error('Error deleting availability block:', deleteError);
          return;
        }
      } else {
        // Create new availability block
        const { error: insertError } = await supabase
          .from('professional_calendar_events')
          .insert([{
            professional_id: professionalId,
            title: 'Indisponível',
            start_time: slotDate.toISOString(),
            end_time: endDate.toISOString(),
            event_type: 'availability_block',
            status: 'confirmed'
          }]);

        if (insertError) {
          console.error('Error creating availability block:', insertError);
          return;
        }
      }

      // Invalidate the calendar events query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['calendar-events', professionalId] });
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  return {
    events,
    isLoading,
    error,
    toggleSlotAvailability
  };
}
