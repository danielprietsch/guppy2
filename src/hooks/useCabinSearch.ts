
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

      // Transform the response to match our Cabin type
      return data.map(cabin => ({
        id: cabin.id,
        locationId: cabin.location_id,
        name: cabin.name,
        description: cabin.description || '',
        equipment: cabin.equipment || [],
        imageUrl: cabin.image_url,
        availability: cabin.availability || { morning: true, afternoon: true, evening: true },
        price: cabin.pricing?.defaultPrice,
        pricing: cabin.pricing
      })) as Cabin[];
    },
  });

  return {
    cabins,
    isLoading,
    searchTerm,
    setSearchTerm,
  };
};
