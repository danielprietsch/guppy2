
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
}

export const useProfessionals = (options: UseProfessionalsOptions = {}) => {
  const { withSpecialties = true, withAvailability = false, date = null } = options;

  const professionalsQuery = useQuery({
    queryKey: ['professionals', date],
    queryFn: async () => {
      if (!date) return [];

      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Get professionals with available slots first
      const { data: availableProfessionals, error: availabilityError } = await supabase
        .from('professional_availability')
        .select(`
          professional_id,
          morning_status,
          afternoon_status,
          evening_status,
          profiles:professional_id (
            id,
            name,
            email,
            avatar_url
          )
        `)
        .eq('date', formattedDate)
        .or('morning_status.eq.free,afternoon_status.eq.free,evening_status.eq.free');

      if (availabilityError) {
        console.error('Error fetching professionals availability:', availabilityError);
        return [];
      }

      // Get active bookings for professionals
      const { data: activeBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('professional_id')
        .eq('date', formattedDate)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return [];
      }

      // Get all services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('professional_id, category');

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return [];
      }

      // Create specialties map
      const specialtiesByProfessional: Record<string, string[]> = {};
      if (services) {
        services.forEach(service => {
          if (!service.professional_id) return;
          
          if (!specialtiesByProfessional[service.professional_id]) {
            specialtiesByProfessional[service.professional_id] = [];
          }
          
          if (!specialtiesByProfessional[service.professional_id].includes(service.category)) {
            specialtiesByProfessional[service.professional_id].push(service.category);
          }
        });
      }

      // Filter and map professionals
      const availableProfessionalsWithBookings = availableProfessionals
        .filter(prof => {
          const hasBooking = activeBookings?.some(
            booking => booking.professional_id === prof.professional_id
          );
          return hasBooking && prof.profiles;
        })
        .map(prof => {
          const profId = prof.professional_id;
          return {
            id: prof.profiles?.id || '',
            name: prof.profiles?.name || '',
            email: prof.profiles?.email || '',
            avatarUrl: prof.profiles?.avatar_url,
            specialties: specialtiesByProfessional[profId] || []
          };
        }) as User[];

      return availableProfessionalsWithBookings;
    },
    enabled: !!date
  });

  return {
    professionals: professionalsQuery.data || [],
    isLoading: professionalsQuery.isLoading,
    isError: professionalsQuery.isError,
    error: professionalsQuery.error
  };
};
