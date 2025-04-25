
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export type ShiftStatus = 'free' | 'busy' | 'closed';

export interface DayAvailability {
  id: string;
  date: Date;
  morning_status: ShiftStatus;
  afternoon_status: ShiftStatus;
  evening_status: ShiftStatus;
}

export const useAvailability = (professionalId: string | undefined) => {
  const queryClient = useQueryClient();
  
  const { data: availability, isLoading } = useQuery({
    queryKey: ['professional-availability', professionalId],
    queryFn: async () => {
      if (!professionalId) return [];
      
      const { data, error } = await supabase
        .from('professional_availability')
        .select('*, working_hours, break_time')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('Error fetching availability:', error);
        return [];
      }

      return data.map(item => ({
        ...item,
        date: new Date(item.date)
      })) as DayAvailability[];
    },
    enabled: !!professionalId
  });

  const updateAvailability = useMutation({
    mutationFn: async (data: { 
      date: Date, 
      status: ShiftStatus, 
      shift: 'morning' | 'afternoon' | 'evening' 
    }) => {
      if (!professionalId) throw new Error('No professional ID');

      const formattedDate = format(data.date, 'yyyy-MM-dd');
      
      // Try to update first
      const { data: existingData, error: fetchError } = await supabase
        .from('professional_availability')
        .select('id')
        .eq('professional_id', professionalId)
        .eq('date', formattedDate)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError;
      }

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('professional_availability')
          .update({
            [`${data.shift}_status`]: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('professional_availability')
          .insert({
            professional_id: professionalId,
            date: formattedDate,
            [`${data.shift}_status`]: data.status
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional-availability', professionalId] });
    }
  });

  return {
    availability: availability || [],
    isLoading,
    updateAvailability
  };
};
