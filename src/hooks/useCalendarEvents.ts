
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

      // Use raw SQL query to fetch events as a workaround until Supabase types are updated
      const { data: calendarEvents, error } = await supabase
        .rpc('fetch_professional_calendar_events', { 
          p_professional_id: professionalId,
          p_start_date: weekStart.toISOString(),
          p_end_date: weekEnd.toISOString()
        });

      if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }

      return (calendarEvents || []) as CalendarEvent[];
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
