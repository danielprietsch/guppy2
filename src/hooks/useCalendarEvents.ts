import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, format, isSameDay, parseISO } from 'date-fns';
import { useWorkingHours } from './useWorkingHours';
import { ptBR } from 'date-fns/locale';

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
  const { workingHours } = useWorkingHours(professionalId);

  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['calendar-events', professionalId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!professionalId) return [];

      // Use a raw Supabase query to call our RPC function with proper type assertion
      const { data, error } = await supabase
        .from('professional_calendar_events')
        .select('*')
        .eq('professional_id', professionalId)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', weekEnd.toISOString());

      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error; // Make sure errors are thrown for query error handling
      }
      
      // If no events are found, return an empty array
      if (!data) return [];
      
      // Otherwise return the properly typed data
      return data as unknown as CalendarEvent[];
    },
    enabled: !!professionalId,
  });

  // Função auxiliar para verificar se um horário está dentro do horário de trabalho
  const isWithinWorkingHours = (date: Date, hour: number) => {
    if (!workingHours) return true;
    
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase() as keyof typeof workingHours;
    const daySettings = workingHours[dayName];
    
    if (!daySettings?.enabled) return false;
    
    const startHour = parseInt(daySettings.start.split(':')[0]);
    const endHour = parseInt(daySettings.end.split(':')[0]);
    
    return hour >= startHour && hour < endHour;
  };

  return {
    events,
    isLoading,
    error,
    isWithinWorkingHours
  };
}
