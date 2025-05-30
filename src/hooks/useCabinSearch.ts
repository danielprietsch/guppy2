
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
      return data.map(cabin => {
        // Parse JSON fields safely
        let availability = { morning: true, afternoon: true, evening: true };
        if (cabin.availability && typeof cabin.availability === 'object') {
          const availObj = cabin.availability as Record<string, any>;
          availability = {
            morning: availObj.morning === true,
            afternoon: availObj.afternoon === true,
            evening: availObj.evening === true
          };
        }

        let pricing = { defaultPricing: {}, specificDates: {} };
        let price = 50; // Default price if not set
        
        if (cabin.pricing && typeof cabin.pricing === 'object') {
          const pricingObj = cabin.pricing as Record<string, any>;
          pricing = {
            defaultPricing: pricingObj.defaultPricing || {},
            specificDates: pricingObj.specificDates || {}
          };
          // Extract price from pricing object if available
          price = pricingObj.defaultPrice || 50;
        }

        return {
          id: cabin.id,
          locationId: cabin.location_id,
          name: cabin.name,
          description: cabin.description || '',
          equipment: cabin.equipment || [],
          imageUrl: cabin.image_url,
          availability,
          price,
          pricing
        } as Cabin;
      });
    },
  });

  return {
    cabins,
    isLoading,
    searchTerm,
    setSearchTerm,
  };
};
