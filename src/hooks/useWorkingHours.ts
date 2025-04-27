
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { toast } from '@/hooks/use-toast';

export interface WorkingHoursDay {
  start: string;
  end: string;
  enabled: boolean;
}

export interface WorkingHours {
  [key: string]: WorkingHoursDay;
}

export interface BreakTime {
  enabled: boolean;
  start: string;
  end: string;
}

// Default working hours configuration
const defaultWorkingHours: WorkingHours = {
  monday: { start: '09:00', end: '17:00', enabled: true },
  tuesday: { start: '09:00', end: '17:00', enabled: true },
  wednesday: { start: '09:00', end: '17:00', enabled: true },
  thursday: { start: '09:00', end: '17:00', enabled: true },
  friday: { start: '09:00', end: '17:00', enabled: true },
  saturday: { start: '09:00', end: '17:00', enabled: false },
  sunday: { start: '09:00', end: '17:00', enabled: false }
};

// Default break time configuration
const defaultBreakTime: BreakTime = {
  enabled: true,
  start: '12:00',
  end: '13:00'
};

// Helper function to check if a given hour is within working hours
export const isHourWithinWorkingHours = (
  hour: number, 
  date: Date, 
  workingHours: WorkingHours,
  breakTime: BreakTime
): boolean => {
  const dayName = format(date, 'EEEE').toLowerCase();
  const daySettings = workingHours[dayName];
  
  // If the day is disabled, return false
  if (!daySettings || !daySettings.enabled) {
    return false;
  }
  
  // Parse start and end hours
  const startHour = parseInt(daySettings.start.split(':')[0]);
  const endHour = parseInt(daySettings.end.split(':')[0]);
  
  // Check if hour is within working hours
  const isWithinWorkingHours = hour >= startHour && hour < endHour;
  
  // Check if hour is within break time
  let isDuringBreak = false;
  if (breakTime.enabled) {
    const breakStartHour = parseInt(breakTime.start.split(':')[0]);
    const breakEndHour = parseInt(breakTime.end.split(':')[0]);
    isDuringBreak = hour >= breakStartHour && hour < breakEndHour;
  }
  
  return isWithinWorkingHours && !isDuringBreak;
};

export const useWorkingHours = (professionalId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: workingHoursData, isLoading } = useQuery({
    queryKey: ['working-hours', professionalId],
    queryFn: async () => {
      if (!professionalId) return null;

      const { data, error } = await supabase
        .from('professional_availability')
        .select('working_hours, break_time')
        .eq('professional_id', professionalId)
        .limit(1);

      if (error) {
        console.error('Error fetching working hours:', error);
        toast({
          title: "Erro ao carregar horários de trabalho",
          description: "Não foi possível carregar suas configurações de horário",
          variant: "destructive"
        });
        return null;
      }

      // If no data exists, return default values
      if (!data || data.length === 0) {
        return {
          working_hours: defaultWorkingHours,
          break_time: defaultBreakTime
        };
      }

      return data[0];
    },
    enabled: !!professionalId
  });

  const updateWorkingHours = useMutation({
    mutationFn: async ({ workingHours, breakTime }: { workingHours: WorkingHours; breakTime: BreakTime }) => {
      if (!professionalId) throw new Error('No professional ID');

      try {
        const formattedDate = format(new Date(), 'yyyy-MM-dd');
        
        // First check if an entry exists for this professional
        const { data: existingData, error: fetchError } = await supabase
          .from('professional_availability')
          .select('id')
          .eq('professional_id', professionalId)
          .limit(1);

        if (fetchError) {
          console.error('Error checking existing availability:', fetchError);
          throw fetchError;
        }

        if (existingData && existingData.length > 0) {
          // Update existing record
          const { error } = await supabase
            .from('professional_availability')
            .update({
              working_hours: workingHours as unknown as Json,
              break_time: breakTime as unknown as Json
            })
            .eq('id', existingData[0].id);

          if (error) throw error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('professional_availability')
            .insert([{
              professional_id: professionalId,
              date: formattedDate,
              working_hours: workingHours as unknown as Json,
              break_time: breakTime as unknown as Json
            }]);

          if (error) throw error;
        }

        toast({
          title: "Horários atualizados",
          description: "Suas configurações de horário foram salvas com sucesso"
        });
      } catch (error) {
        console.error('Error updating working hours:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar seus horários de trabalho",
          variant: "destructive"
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours', professionalId] });
      // Also invalidate calendar events as they depend on working hours
      queryClient.invalidateQueries({ queryKey: ['calendar-events', professionalId] });
    }
  });

  // Use our type assertions to safely convert the JSON data to our expected types
  const typedWorkingHours = workingHoursData?.working_hours ? 
    workingHoursData.working_hours as unknown as WorkingHours : 
    defaultWorkingHours;

  const typedBreakTime = workingHoursData?.break_time ? 
    workingHoursData.break_time as unknown as BreakTime : 
    defaultBreakTime;

  return {
    workingHours: typedWorkingHours,
    breakTime: typedBreakTime,
    isLoading,
    updateWorkingHours
  };
};
