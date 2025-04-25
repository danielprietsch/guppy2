
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
}

// Define a Professional type that extends User with the specific properties we need
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
};

export const useProfessionals = (options: UseProfessionalsOptions = {}) => {
  const { withSpecialties = true, withAvailability = false, date = new Date() } = options;

  return useQuery<Professional[], Error>({
    queryKey: ['professionals', date ? format(date, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      try {
        // Calculate the start and end of the week for the given date
        const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd');
        
        console.log('Fetching professionals for week:', weekStart, 'to', weekEnd);

        // First get all active bookings for the week
        const { data: activeBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('professional_id')
          .gte('date', weekStart)
          .lte('date', weekEnd)
          .eq('status', 'confirmed');

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          return [];
        }

        // Get unique professional IDs from bookings
        const professionalIds = [...new Set(activeBookings?.map(b => b.professional_id) || [])];

        if (professionalIds.length === 0) {
          console.log('No professionals with active bookings found');
          return [];
        }

        // Get professionals that have active bookings
        const { data: professionalsData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional')
          .eq('is_public', true)
          .in('id', professionalIds);

        if (error) {
          console.error('Error fetching professional profiles:', error);
          return [];
        }

        // If no professionals found, return empty array
        if (!professionalsData || !Array.isArray(professionalsData) || professionalsData.length === 0) {
          console.log('No professional profiles found');
          return [];
        }

        // Get services for the filtered professionals
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, name, category, price')
          .in('professional_id', professionalIds);

        // Get reviews for the filtered professionals
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('professional_id, rating')
          .in('professional_id', professionalIds);

        // Get availability if requested
        let availability = [];
        if (withAvailability) {
          const { data: availData, error: availError } = await supabase
            .from('professional_availability')
            .select('*')
            .in('professional_id', professionalIds)
            .eq('date', format(date, 'yyyy-MM-dd'));
          
          if (availError) {
            console.error('Error fetching availability:', availError);
          } else {
            availability = availData || [];
          }
        }

        // Process and combine all data
        return professionalsData.map(prof => {
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

          // Ensure user_type is one of the allowed types
          const userType = prof.user_type === 'professional' ? 'professional' : 
                           prof.user_type === 'client' ? 'client' : 
                           prof.user_type === 'owner' ? 'owner' : 
                           prof.user_type === 'global_admin' ? 'global_admin' : 'professional';

          return {
            ...prof,
            user_type: userType as "professional" | "client" | "owner" | "global_admin",
            specialties,
            services: profServices,
            rating: avgRating,
            reviewCount: profReviews.length,
            availability: profAvailability,
          } as Professional;
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
