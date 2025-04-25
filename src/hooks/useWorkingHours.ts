
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

      return data?.[0] ?? null;
    },
    enabled: !!professionalId
  });

  const updateWorkingHours = useMutation({
    mutationFn: async ({ workingHours, breakTime }: { workingHours: WorkingHours; breakTime: BreakTime }) => {
      if (!professionalId) throw new Error('No professional ID');

      const { error } = await supabase
        .from('professional_availability')
        .upsert({
          professional_id: professionalId,
          date: format(new Date(), 'yyyy-MM-dd'),
          working_hours: workingHours,
          break_time: breakTime
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours', professionalId] });
    }
  });

  return {
    workingHours: workingHours?.working_hours as WorkingHours | undefined,
    breakTime: workingHours?.break_time as BreakTime | undefined,
    isLoading,
    updateWorkingHours
  };
};
