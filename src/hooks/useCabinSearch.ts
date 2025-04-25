
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Cabin } from '@/lib/types';

export const useCabinSearch = (locationId?: string) => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: cabins = [], isLoading } = useQuery({
    queryKey: ['cabins', locationId, searchTerm],
    queryFn: async () => {
      let query = supabase.from('cabins').select('*');

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching cabins:', error);
        return [];
      }

      return data as Cabin[];
    },
  });

  return {
    cabins,
    isLoading,
    searchTerm,
    setSearchTerm,
  };
};
