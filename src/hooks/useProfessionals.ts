
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
  
  // Use the existing useUsers hook as a fallback
  const { data: allProfessionals } = useUsers('professional');

  const professionalsQuery = useQuery({
    queryKey: ['professionals', date],
    queryFn: async () => {
      try {
        if (!date) {
          // If no date provided, return all professionals from the useUsers hook
          return allProfessionals || [];
        }
        
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        console.log('Fetching professionals for date:', formattedDate);
        
        // First, directly fetch all professionals to avoid RLS issues
        const { data: professionals, error: professionalError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional');
          
        if (professionalError) {
          console.error('Error fetching professionals:', professionalError);
          // Return fallback data from useUsers hook
          return allProfessionals || [];
        }
        
        // Get services data separately
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('professional_id, category');

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
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
        
        // Get availability data separately
        let availableProfessionalIds: string[] = [];
        
        if (withAvailability) {
          const { data: availability, error: availabilityError } = await supabase
            .from('professional_availability')
            .select('professional_id')
            .eq('date', formattedDate)
            .or('morning_status.eq.free,afternoon_status.eq.free,evening_status.eq.free');

          if (!availabilityError && availability) {
            availableProfessionalIds = availability.map(a => a.professional_id);
            console.log('Available professional IDs:', availableProfessionalIds);
          } else if (availabilityError) {
            console.error('Error fetching availability:', availabilityError);
          }
        }
        
        // Get bookings data separately
        let professionalIdsWithBookings: string[] = [];
        
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('professional_id')
          .eq('date', formattedDate)
          .eq('status', 'confirmed');

        if (!bookingsError && bookings) {
          professionalIdsWithBookings = bookings.map(b => b.professional_id);
          console.log('Professionals with bookings:', professionalIdsWithBookings);
        } else if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
        }
        
        // Process professionals data
        let processedProfessionals = professionals.map(prof => ({
          id: prof.id,
          name: prof.name || '',
          email: prof.email || '',
          avatarUrl: prof.avatar_url,
          avatar_url: prof.avatar_url,
          specialties: specialtiesByProfessional[prof.id] || []
        })) as User[];
        
        // Filter based on availability and bookings if required
        if (withAvailability) {
          processedProfessionals = processedProfessionals.filter(prof => 
            availableProfessionalIds.includes(prof.id) && 
            professionalIdsWithBookings.includes(prof.id)
          );
        }
        
        console.log('Final professionals list:', processedProfessionals.length);
        return processedProfessionals;
      } catch (error) {
        console.error('Error in useProfessionals hook:', error);
        // Return fallback data from useUsers hook
        return allProfessionals || [];
      }
    },
    // Enable the query unconditionally - we'll return all professionals if no date is provided
    enabled: true
  });

  return {
    professionals: professionalsQuery.data || [],
    isLoading: professionalsQuery.isLoading,
    isError: professionalsQuery.isError,
    error: professionalsQuery.error
  };
};
