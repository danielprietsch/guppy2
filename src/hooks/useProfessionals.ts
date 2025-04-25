
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { debugAreaLog } from '@/utils/debugLogger';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
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
    date = new Date() 
  } = options;

  return useQuery<Professional[], Error>({
    queryKey: [
      'professionals', 
      date ? (date instanceof Date ? format(date, 'yyyy-MM') : date) : null,
      withSpecialties,
      withAvailability
    ],
    queryFn: async () => {
      try {
        console.log('Fetching professionals with options:', { 
          withSpecialties, 
          withAvailability, 
          date: date instanceof Date ? format(date, 'yyyy-MM-dd') : date 
        });
        
        const startDate = date instanceof Date ? startOfMonth(date) : date;
        const endDate = date instanceof Date ? endOfMonth(date) : date;

        // First, get all professional profiles without any filtering
        const { data: professionalsData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional');
          
        if (error) {
          console.error('Error fetching professional profiles:', error);
          throw error; // Throw error to be caught by React Query
        }

        // If no professionals found, return empty array
        if (!professionalsData || !Array.isArray(professionalsData) || professionalsData.length === 0) {
          console.log('No professional profiles found');
          return [];
        }
        
        console.log(`Found ${professionalsData.length} professional profiles:`, professionalsData);

        // Get professional IDs
        const professionalIds = professionalsData.map(prof => prof.id);
        
        // Get services for the professionals - this is crucial for displaying specialties
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, name, category, price')
          .in('professional_id', professionalIds);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }
        
        console.log(`Found ${services?.length || 0} services for professionals:`, services || 'No services data');

        // Get reviews for the professionals
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('professional_id, rating')
          .in('professional_id', professionalIds);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        }
        
        console.log(`Found ${reviews?.length || 0} reviews for professionals`);

        // Get availability if requested
        let availability = [];
        if (withAvailability && date instanceof Date) {
          const availabilityQuery = supabase
            .from('professional_availability')
            .select('*')
            .in('professional_id', professionalIds);
            
          if (options.date !== null) {
            availabilityQuery
              .gte('date', format(startDate, 'yyyy-MM-dd'))
              .lte('date', format(endDate, 'yyyy-MM-dd'));
          }
          
          const { data: availData, error: availError } = await availabilityQuery;
          
          if (availError) {
            console.error('Error fetching availability:', availError);
          } else {
            availability = availData || [];
            console.log(`Found availability data for ${availability.length} entries:`, availability);
          }
        }

        // Process and combine all data
        const professionals = professionalsData.map(prof => {
          // Calculate average rating
          const profReviews = reviews?.filter(r => r.professional_id === prof.id) || [];
          const avgRating = profReviews.length > 0
            ? profReviews.reduce((acc, rev) => acc + rev.rating, 0) / profReviews.length
            : null;

          // Get professional's services
          const profServices = services?.filter(s => s.professional_id === prof.id) || [];
          
          // If withSpecialties is true and there are no services, return null to filter out
          if (withSpecialties && profServices.length === 0) {
            debugAreaLog('AVAILABILITY', `Professional ${prof.id} has no services, filtering out`);
            return null;
          }
          
          const specialties = [...new Set(profServices.map(s => s.category))];

          // Get availability for this professional
          const profAvailability = availability.find(a => a.professional_id === prof.id);

          // Ensure user_type is one of the allowed types
          const userType = prof.user_type === 'professional' ? 'professional' : 
                          prof.user_type === 'client' ? 'client' : 
                          prof.user_type === 'owner' ? 'owner' : 
                          prof.user_type === 'global_admin' ? 'global_admin' : 'professional';

          console.log(`Processing professional ${prof.id} - Name: ${prof.name}, Services: ${profServices.length}, Specialties: ${specialties.join(', ')}`);

          return {
            ...prof,
            user_type: userType as "professional" | "client" | "owner" | "global_admin",
            specialties,
            services: profServices,
            rating: avgRating,
            reviewCount: profReviews.length,
            availability: profAvailability,
            // Always set to true for now to make professionals appear
            hasConfirmedBookings: true
          } as Professional;
        }).filter(Boolean) as Professional[];

        console.log(`Returning ${professionals.length} available professionals`);
        return professionals;

      } catch (error) {
        console.error('Error in useProfessionals hook:', error);
        throw error; // Throw error to be caught by React Query
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 2,
  });
};
