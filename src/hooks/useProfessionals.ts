
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
  const { data: allProfessionals } = useUsers('professional');

  // Updated to use object syntax for query configuration
  return useQuery({
    queryKey: ['professionals', date],
    queryFn: async () => {
      try {
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        console.log('Fetching professionals for date:', formattedDate);

        // 1. Fetch professionals with availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('professional_availability')
          .select('professional_id')
          .eq('date', formattedDate)
          .or('morning_status.eq.free,afternoon_status.eq.free,evening_status.eq.free');

        if (availabilityError) {
          console.error('Error fetching availability:', availabilityError);
          throw availabilityError;
        }

        const availableProfessionalIds = availabilityData.map(a => a.professional_id);
        console.log('Available professional IDs:', availableProfessionalIds);

        // 2. Fetch bookings to confirm they have a cabin booked
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('professional_id')
          .eq('date', formattedDate)
          .eq('status', 'confirmed');

        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          throw bookingsError;
        }

        const professionalIdsWithBookings = bookingsData.map(b => b.professional_id);
        console.log('Professionals with bookings:', professionalIdsWithBookings);

        // 3. Get the actual professional profiles that have both availability and bookings
        const availableAndBookedIds = availableProfessionalIds.filter(id => 
          professionalIdsWithBookings.includes(id)
        );

        if (availableAndBookedIds.length === 0) {
          console.log('No professionals available with confirmed bookings');
          return [];
        }

        // 4. Fetch the full profile data for these professionals
        const { data: professionals, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional')
          .in('id', availableAndBookedIds);

        if (profilesError) {
          console.error('Error fetching professional profiles:', profilesError);
          throw profilesError;
        }

        // 5. If withSpecialties is true, fetch their specialties
        if (withSpecialties) {
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('professional_id, category')
            .in('professional_id', availableAndBookedIds);

          if (servicesError) {
            console.error('Error fetching services:', servicesError);
          } else {
            // Group specialties by professional
            const specialtiesByProfessional: Record<string, string[]> = {};
            services?.forEach(service => {
              if (!service.professional_id) return;
              if (!specialtiesByProfessional[service.professional_id]) {
                specialtiesByProfessional[service.professional_id] = [];
              }
              if (!specialtiesByProfessional[service.professional_id].includes(service.category)) {
                specialtiesByProfessional[service.professional_id].push(service.category);
              }
            });

            // Add specialties to professional profiles
            return professionals.map(prof => ({
              ...prof,
              specialties: specialtiesByProfessional[prof.id] || []
            })) as User[];
          }
        }

        return professionals as User[];
      } catch (error) {
        console.error('Error in useProfessionals hook:', error);
        throw error;
      }
    }
  });
};
