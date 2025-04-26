
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
        
        // First, directly query the profiles table for professional users
        const { data: professionalsData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional');
          
        if (error) {
          console.error('Error fetching professional profiles:', error);
          throw error;
        }

        console.log(`Raw professionals data returned from database:`, professionalsData);

        // If no professionals found, return empty array
        if (!professionalsData || !Array.isArray(professionalsData) || professionalsData.length === 0) {
          console.log('No professional profiles found in database');
          return [];
        }
        
        // Get professional IDs
        const professionalIds = professionalsData.map(prof => prof.id);
        console.log(`Found ${professionalIds.length} professional IDs:`, professionalIds);
        
        // Get services for the professionals
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, name, category, price')
          .in('professional_id', professionalIds);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        }
        
        console.log(`Services data:`, services || 'No services found');

        // Get reviews for the professionals
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('professional_id, rating')
          .in('professional_id', professionalIds);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        }
        
        console.log(`Reviews data:`, reviews || 'No reviews found');

        // Process and combine all data
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
          
          // Important: Don't filter out professionals who have no services/specialties
          // when withSpecialties is true - temporarily disabling this filter
          // to troubleshoot why no professionals are showing
          
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
            // Always set to true for now to make professionals appear
            hasConfirmedBookings: true
          } as Professional;
          
          console.log(`Processed professional: ${prof.id} - ${prof.name} - Services: ${profServices.length}, Specialties: ${specialties.join(', ')}`);
          
          return professional;
        });

        console.log(`Returning ${professionals.length} professionals after processing`);
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
