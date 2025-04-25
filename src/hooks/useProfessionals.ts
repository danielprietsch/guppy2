
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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

        // First, get all public professional profiles
        const { data: professionalsData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional');
          // Removed .eq('is_public', true) to see all professionals for debugging

        if (error) {
          console.error('Error fetching professional profiles:', error);
          return [];
        }

        // If no professionals found, return empty array
        if (!professionalsData || !Array.isArray(professionalsData) || professionalsData.length === 0) {
          console.log('No professional profiles found');
          return [];
        }
        
        console.log(`Found ${professionalsData.length} professional profiles:`, professionalsData);

        // Get professional IDs
        const professionalIds = professionalsData.map(prof => prof.id);
        
        // Check which professionals have confirmed bookings
        const { data: professionalBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('professional_id');
          // Removed .eq('status', 'paid') to see all bookings for debugging
          
        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        }
        
        const professionalsWithConfirmedBookings = new Set(
          professionalBookings?.map(b => b.professional_id) || []
        );
        
        console.log(`Found ${professionalsWithConfirmedBookings.size} professionals with confirmed bookings:`, 
          professionalBookings ? professionalBookings : 'No bookings data');

        // Get services for the professionals
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

        // Get availability for the specified date or month
        let availability = [];
        if (withAvailability) {
          // If in month mode or no date provided, don't filter by date for debugging
          const availabilityQuery = supabase
            .from('professional_availability')
            .select('*')
            .in('professional_id', professionalIds);
            
          // Only apply date filtering in day mode
          if (date instanceof Date && options.date !== null) {
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
          
          // Only include professionals with services if withSpecialties is true
          if (withSpecialties && profServices.length === 0) {
            console.log(`Professional ${prof.id} has no services, skipping`);
            return null;
          }
          
          const specialties = [...new Set(profServices.map(s => s.category))];

          // Filter availability based on date mode
          const profAvailability = availability.find(a => a.professional_id === prof.id);

          // Ensure user_type is one of the allowed types
          const userType = prof.user_type === 'professional' ? 'professional' : 
                          prof.user_type === 'client' ? 'client' : 
                          prof.user_type === 'owner' ? 'owner' : 
                          prof.user_type === 'global_admin' ? 'global_admin' : 'professional';

          const hasBookings = professionalsWithConfirmedBookings.has(prof.id);
          console.log(`Processing professional ${prof.id} - Name: ${prof.name}, Has bookings: ${hasBookings}, Services: ${profServices.length}, Specialties: ${specialties.join(', ')}`);

          return {
            ...prof,
            user_type: userType as "professional" | "client" | "owner" | "global_admin",
            specialties,
            services: profServices,
            rating: avgRating,
            reviewCount: profReviews.length,
            availability: profAvailability,
            hasConfirmedBookings: hasBookings
          } as Professional;
        }).filter(Boolean) as Professional[];

        // For debugging, temporarily allow all professionals without booking confirmation
        // This will help us see if the issue is with booking confirmation
        const availableProfessionals = professionals;
        
        /* Original filtering logic commented out for debugging
        const availableProfessionals = professionals.filter(prof => {
          // First check if they have confirmed bookings
          if (!prof.hasConfirmedBookings) {
            console.log(`Professional ${prof.id} has no confirmed bookings, filtering out`);
            return false;
          }
          
          // If in day mode, check daily availability
          if (date instanceof Date) {
            const avail = prof.availability;
            if (!avail) {
              console.log(`Professional ${prof.id} has no availability data, filtering out`);
              return false;
            }
            
            const hasAvailableSlot = 
              avail.morning_status === 'free' || 
              avail.afternoon_status === 'free' || 
              avail.evening_status === 'free';
              
            if (!hasAvailableSlot) {
              console.log(`Professional ${prof.id} has no free shifts, filtering out`);
            }
            
            return hasAvailableSlot;
          }
          
          // If in month mode, just return true (professional has confirmed bookings)
          return true;
        });
        */

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
