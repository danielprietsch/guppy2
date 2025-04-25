
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
        console.log('Fetching professionals with confirmed bookings and availability');
        
        const formattedDate = format(date, 'yyyy-MM-dd');

        // Get professionals with confirmed bookings
        const { data: professionalsWithBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('professional_id')
          .eq('status', 'paid')
          .eq('date', formattedDate)
          .not('professional_id', 'is', null);

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          return [];
        }

        // If no professionals have bookings, return empty array
        if (!professionalsWithBookings || professionalsWithBookings.length === 0) {
          console.log('No professionals with confirmed bookings found');
          return [];
        }

        // Get the unique professional IDs
        const professionalIds = [...new Set(professionalsWithBookings.map(b => b.professional_id))];
        
        // Get all public professional profiles for those with bookings
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
          console.log('No matching professional profiles found');
          return [];
        }
        
        console.log(`Found ${professionalsData.length} professional profiles`);

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

        // Get availability if requested
        let availability = [];
        if (withAvailability && date) {
          const { data: availData, error: availError } = await supabase
            .from('professional_availability')
            .select('*')
            .in('professional_id', professionalIds)
            .eq('date', formattedDate);
          
          if (availError) {
            console.error('Error fetching availability:', availError);
          } else {
            availability = availData || [];
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
          
          // Only include professionals with services if withSpecialties is true
          if (withSpecialties && profServices.length === 0) {
            console.log(`Professional ${prof.id} has no services, skipping`);
            return null;
          }
          
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
        }).filter(Boolean) as Professional[];

        // Filter professionals based on availability
        const availableProfessionals = professionals.filter(prof => {
          const avail = prof.availability;
          if (!avail) return false;
          
          // Check if professional has at least one free shift
          return avail.morning_status === 'free' || 
                 avail.afternoon_status === 'free' || 
                 avail.evening_status === 'free';
        });

        console.log(`Returning ${availableProfessionals.length} available professionals`);
        return availableProfessionals;

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
