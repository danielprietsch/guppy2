
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';

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

export const useWorkingHours = (professionalId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: workingHours, isLoading } = useQuery({
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

      const formattedDate = format(new Date(), 'yyyy-MM-dd');
      
      // First check if an entry exists for this professional
      const { data: existingData, error: fetchError } = await supabase
        .from('professional_availability')
        .select('id')
        .eq('professional_id', professionalId)
        .limit(1);

      if (fetchError) {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours', professionalId] });
    }
  });

  // Use our type assertions to safely convert the JSON data to our expected types
  const typedWorkingHours = workingHours?.working_hours ? 
    workingHours.working_hours as unknown as WorkingHours : 
    defaultWorkingHours;

  const typedBreakTime = workingHours?.break_time ? 
    workingHours.break_time as unknown as BreakTime : 
    defaultBreakTime;

  return {
    workingHours: typedWorkingHours,
    breakTime: typedBreakTime,
    isLoading,
    updateWorkingHours
  };
};
