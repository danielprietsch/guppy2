
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface UseProfessionalsOptions {
  withSpecialties?: boolean;
  withAvailability?: boolean;
  date?: Date | null;
}

export const useProfessionals = (options: UseProfessionalsOptions = {}) => {
  const { withSpecialties = true, withAvailability = false, date = null } = options;
  
  // Fetch professionals
  const professionalsQuery = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'professional');
      
      if (error) {
        console.error('Error fetching professionals:', error);
        return [];
      }
      
      // Map the Supabase profile data to our User type
      return data.map(profile => ({
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        user_type: profile.user_type,
        userType: profile.user_type,
        avatarUrl: profile.avatar_url,
        avatar_url: profile.avatar_url,
        phoneNumber: profile.phone_number,
        phone_number: profile.phone_number,
        cpf: profile.cpf,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zip_code,
        specialties: [],
        created_at: profile.created_at,
        updated_at: profile.updated_at
      })) as User[];
    }
  });

  // Fetch services for specialties
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('category, professional_id');
      
      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }
      
      return data;
    },
    enabled: withSpecialties
  });

  // Fetch availability data if required
  const availabilityQuery = useQuery({
    queryKey: ['availability', date],
    queryFn: async () => {
      if (!date) return [];
      
      const formattedDate = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('professional_availability')
        .select('*')
        .eq('date', formattedDate)
        .or('morning_status.eq.free,afternoon_status.eq.free,evening_status.eq.free');
      
      if (error) {
        console.error('Error fetching availability:', error);
        return [];
      }
      
      return data;
    },
    enabled: withAvailability && !!date
  });

  // Create a professionals list with specialties and availability
  let professionals = professionalsQuery.data || [];
  
  // Add specialties to professionals if requested
  if (withSpecialties && servicesQuery.data) {
    const specialtiesMap = new Map<string, string[]>();
    
    servicesQuery.data.forEach(service => {
      if (service.professional_id && service.category) {
        const existing = specialtiesMap.get(service.professional_id) || [];
        if (!existing.includes(service.category)) {
          specialtiesMap.set(service.professional_id, [...existing, service.category]);
        }
      }
    });
    
    professionals = professionals.map(professional => ({
      ...professional,
      specialties: specialtiesMap.get(professional.id) || []
    }));
  }
  
  // Filter by availability if requested
  if (withAvailability && availabilityQuery.data) {
    const availableProfessionalIds = availabilityQuery.data.map(item => item.professional_id);
    professionals = professionals.filter(professional => 
      availableProfessionalIds.includes(professional.id)
    );
  }
  
  // Extract unique specialties from all professionals
  const specialties = Array.from(
    new Set(
      professionals.flatMap(professional => 
        professional.specialties || []
      )
    )
  ).filter(Boolean);

  return {
    professionals,
    specialties,
    isLoading: professionalsQuery.isLoading || 
               (withSpecialties && servicesQuery.isLoading) || 
               (withAvailability && availabilityQuery.isLoading),
    isError: professionalsQuery.isError || 
             (withSpecialties && servicesQuery.isError) || 
             (withAvailability && availabilityQuery.isError),
    error: professionalsQuery.error || 
           (withSpecialties && servicesQuery.error) || 
           (withAvailability && availabilityQuery.error)
  };
};
