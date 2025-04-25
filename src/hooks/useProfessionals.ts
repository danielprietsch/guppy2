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

  return useQuery({
    queryKey: ['professionals', date ? format(date, 'yyyy-MM-dd') : null],
    queryFn: async () => {
      try {
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        console.log('Fetching professionals for date:', formattedDate);

        // Fetch only public professional profiles
        const { data: professionals, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'professional')
          .eq('is_public', true); // Only fetch public profiles

        if (error) {
          console.error('Error fetching professional profiles:', error);
          return [];
        }

        // If no professionals found, return empty array
        if (!professionals || professionals.length === 0) {
          console.log('No professional profiles found');
          return [];
        }

        // 5. If withSpecialties is true, fetch their specialties
        if (withSpecialties) {
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('professional_id, category')
            .in('professional_id', professionals.map(p => p.id));

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
