
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format } from 'date-fns';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
}

export const useProfessionals = (options: UseProfessionalsOptions = {}) => {
  const { withSpecialties = true, withAvailability = false, date = null } = options;

  // Fetch professionals with availability and bookings
  const professionalsQuery = useQuery({
    queryKey: ['professionals', date],
    queryFn: async () => {
      if (!date) return [];

      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // First get professionals with availability
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

      // Get professionals with active bookings
      const { data: activeBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('professional_id, cabin_id')
        .eq('date', formattedDate)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        return [];
      }

      // Get all services to map specialties
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('professional_id, category');
      
      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return [];
      }

      // Create a map of professional IDs to their specialties
      const specialtiesByProfessional: Record<string, string[]> = {};
      services.forEach(service => {
        if (!service.professional_id) return;
        
        if (!specialtiesByProfessional[service.professional_id]) {
          specialtiesByProfessional[service.professional_id] = [];
        }
        
        if (!specialtiesByProfessional[service.professional_id].includes(service.category)) {
          specialtiesByProfessional[service.professional_id].push(service.category);
        }
      });

      // Filter professionals who have both availability and an active booking
      const availableProfessionalsWithBookings = availableProfessionals
        .filter(prof => {
          const hasBooking = activeBookings.some(
            booking => booking.professional_id === prof.professional_id
          );
          return hasBooking && prof.profiles;
        })
        .map(prof => {
          const profId = prof.professional_id;
          const specialties = specialtiesByProfessional[profId] || [];
          
          return {
            id: prof.profiles?.id || '',
            name: prof.profiles?.name || '',
            email: prof.profiles?.email || '',
            avatarUrl: prof.profiles?.avatar_url,
            specialties: specialties
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
