
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { debugAreaLog } from '@/utils/debugLogger';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
  ignoreAvailability?: boolean; // New option to bypass availability filtering
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
    date = new Date(),
    ignoreAvailability = true // Default to true to show all professionals
  } = options;

  return useQuery<Professional[], Error>({
    queryKey: [
      'professionals', 
      ignoreAvailability ? 'all' : (date ? (date instanceof Date ? format(date, 'yyyy-MM') : date) : null),
      withSpecialties,
      withAvailability
    ],
    queryFn: async () => {
      try {
        console.log('CRITICAL: Fetching all professionals, ignoring availability filters...');
        debugAreaLog('USER_ACTIONS', 'Fetching professionals with options:', { 
          withSpecialties, 
          withAvailability, 
          date: date instanceof Date ? format(date, 'yyyy-MM-dd') : date,
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
        
        // If no professionals found, log this clearly
        if (!professionalsData || professionalsData.length === 0) {
          console.log('CRITICAL: No professional profiles found in database. Check your Supabase data.');
          
          // Return empty array but don't throw an error so the UI can show "no professionals found" message
          return [];
        }
        
        // Get professional IDs
        const professionalIds = professionalsData.map(prof => prof.id);
        
        // Get services for the professionals
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, name, category, price')
          .in('professional_id', professionalIds);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }
        
        console.log(`Services data for ${services?.length || 0} services:`, services || 'No services found');

        // Get reviews for the professionals
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('professional_id, rating')
          .in('professional_id', professionalIds);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        }
        
        // Process and combine all data - ALWAYS RETURN ALL PROFESSIONALS
        // even if they don't have services or reviews yet
        const professionals = professionalsData.map(prof => {
          // Calculate average rating
          const profReviews = reviews?.filter(r => r.professional_id === prof.id) || [];
          const avgRating = profReviews.length > 0
            ? profReviews.reduce((acc, rev) => acc + rev.rating, 0) / profReviews.length
            : null;

          // Get professional's services
          const profServices = services?.filter(s => s.professional_id === prof.id) || [];
          
          // Get unique specialties from services
          const specialties = [...new Set(profServices.map(s => s.category))];
          
          // Ensure user_type is one of the allowed types
          const userType = prof.user_type === 'professional' ? 'professional' : 
                          prof.user_type === 'client' ? 'client' : 
                          prof.user_type === 'owner' ? 'owner' : 
                          prof.user_type === 'global_admin' ? 'global_admin' : 'professional';

          const professional = {
            ...prof,
            user_type: userType as "professional" | "client" | "owner" | "global_admin",
            specialties: specialties.length > 0 ? specialties : [], // Provide empty array if no specialties
            services: profServices,
            rating: avgRating,
            reviewCount: profReviews.length,
            // Always set to true to make professionals appear
            hasConfirmedBookings: true
          } as Professional;
          
          console.log(`Professional ${prof.id}: ${prof.name || 'unnamed'} with ${profServices.length} services and ${specialties.length} specialties`);
          
          return professional;
        });

        console.log(`Final: Returning ${professionals.length} professionals after processing`);
        return professionals;

      } catch (error) {
        console.error('Error in useProfessionals hook:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    retry: 2,
  });
};
