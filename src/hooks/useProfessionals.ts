
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format, isValid } from 'date-fns';
import { debugAreaLog } from '@/utils/debugLogger';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
  ignoreAvailability?: boolean;
}

export type Professional = User & {
  specialties: string[];
  services: Array<{
    professional_id: string;
    name: string;
    category: string;
    price: number;
  }>;
  rating: number | null;
  reviewCount: number;
  availability?: {
    morning_status: string;
    afternoon_status: string;
    evening_status: string;
  } | null;
  hasConfirmedBookings?: boolean;
};

export const useProfessionals = (options: UseProfessionalsOptions = {}) => {
  const { 
    withSpecialties = true, 
    withAvailability = false, 
    date = null,
    ignoreAvailability = false 
  } = options;

  // Safely format the date if it exists and is valid
  const safelyFormatDate = (date: Date | null): string | null => {
    if (!date) return null;
    return isValid(date) ? format(date, 'yyyy-MM-dd') : null;
  };

  const formattedDate = safelyFormatDate(date);

  return useQuery<Professional[], Error>({
    queryKey: [
      'professionals', 
      ignoreAvailability ? 'all' : (formattedDate || 'any'),
      withSpecialties,
      withAvailability
    ],
    queryFn: async () => {
      try {
        console.log('CRITICAL: Fetching all professionals...');
        debugAreaLog('USER_ACTIONS', 'Fetching professionals with options:', { 
          withSpecialties, 
          withAvailability, 
          date: formattedDate || 'any',
          ignoreAvailability
        });

        // First, directly query the profiles table for ALL professional users
        // WITHOUT any filtering at this stage
        const { data: professionalsData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional');
          
        if (error) {
          console.error('Error fetching professional profiles:', error);
          throw error;
        }

        console.log(`Found ${professionalsData?.length || 0} professional profiles:`, professionalsData);
        
        if (!professionalsData || professionalsData.length === 0) {
          console.log('CRITICAL: No professional profiles found in database.');
          return [];
        }
        
        const professionalIds = professionalsData.map(prof => prof.id);
        
        // Get services for the professionals
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, name, category, price')
          .in('professional_id', professionalIds);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }

        // Get reviews for the professionals
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('professional_id, rating')
          .in('professional_id', professionalIds);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        }
        
        // Process and filter professionals based on availability if required
        const professionals = await Promise.all(professionalsData.map(async (prof) => {
          const profReviews = reviews?.filter(r => r.professional_id === prof.id) || [];
          const avgRating = profReviews.length > 0
            ? profReviews.reduce((acc, rev) => acc + rev.rating, 0) / profReviews.length
            : null;

          const profServices = services?.filter(s => s.professional_id === prof.id) || [];
          const specialties = [...new Set(profServices.map(s => s.category))];

          // If a date is provided, check availability for each shift
          let hasConfirmedBookings = true;
          if (date && !ignoreAvailability) {
            const shifts = ['morning', 'afternoon', 'evening'];
            const availabilityPromises = shifts.map(async (shift) => {
              const { data, error } = await supabase.rpc('check_professional_availability', {
                p_professional_id: prof.id,
                p_date: formattedDate,
                p_shift: shift
              });

              if (error) {
                console.error(`Error checking availability for ${prof.name} in ${shift} shift:`, error);
                return false;
              }

              return data;
            });

            const availabilityResults = await Promise.all(availabilityPromises);
            hasConfirmedBookings = availabilityResults.some(result => result);
          }

          return {
            ...prof,
            user_type: prof.user_type as "professional" | "client" | "owner" | "global_admin",
            specialties: specialties.length > 0 ? specialties : [],
            services: profServices,
            rating: avgRating,
            reviewCount: profReviews.length,
            hasConfirmedBookings
          } as Professional;
        }));

        // Filter out professionals without confirmed bookings if a date is specified and we're not ignoring availability
        const filteredProfessionals = date && !ignoreAvailability 
          ? professionals.filter(p => p.hasConfirmedBookings)
          : professionals;

        console.log(`Final: Returning ${filteredProfessionals.length} professionals after processing`);
        return filteredProfessionals;

      } catch (error) {
        console.error('Error in useProfessionals hook:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 2,
  });
};
