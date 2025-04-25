
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useUsers } from '@/hooks/useUsers';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
}

export const useProfessionals = (options: UseProfessionalsOptions = {}) => {
  const { withSpecialties = true, withAvailability = false, date = null } = options;

  return useQuery({
    queryKey: ['professionals', date ? format(date, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      try {
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        console.log('Fetching professionals for date:', formattedDate);

        // Using explicit type assertion for the RPC function
        const { data: professionals, error } = await supabase.rpc('get_public_professionals');
        
        if (error) {
          console.error('Error fetching professional profiles:', error);
          return [];
        }

        // If no professionals found, return empty array
        if (!professionals || !Array.isArray(professionals) || professionals.length === 0) {
          console.log('No professional profiles found');
          return [];
        }

        // Get services for all professionals
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, name, category, price')
          .in('professional_id', professionals.map(p => p.id));

        // Get reviews for all professionals
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('professional_id, rating')
          .in('professional_id', professionals.map(p => p.id));

        // Get availability for all professionals if requested
        let availability = [];
        if (withAvailability) {
          const { data: availData, error: availError } = await supabase
            .from('professional_availability')
            .select('*')
            .in('professional_id', professionals.map(p => p.id))
            .eq('date', formattedDate);
          
          if (availError) {
            console.error('Error fetching availability:', availError);
          } else {
            availability = availData || [];
          }
        }

        // Process and combine all data
        return professionals.map(prof => {
          // Calculate average rating
          const profReviews = reviews?.filter(r => r.professional_id === prof.id) || [];
          const avgRating = profReviews.length > 0
            ? profReviews.reduce((acc, rev) => acc + rev.rating, 0) / profReviews.length
            : null;

          // Get professional's services
          const profServices = services?.filter(s => s.professional_id === prof.id) || [];
          const specialties = [...new Set(profServices.map(s => s.category))];

          // Get availability status
          const profAvailability = availability.find(a => a.professional_id === prof.id);

          return {
            ...prof,
            specialties,
            services: profServices,
            rating: avgRating,
            reviewCount: profReviews.length,
            availability: profAvailability,
          };
        });

      } catch (error) {
        console.error('Error in useProfessionals hook:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
};
