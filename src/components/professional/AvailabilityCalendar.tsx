
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay, parseISO, addDays, isAfter, isBefore } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAvailability, ShiftStatus } from "@/hooks/useAvailability";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useSearchParams } from "react-router-dom";
import WorkingHoursSettings from './WorkingHoursSettings';
import DailyView from './calendar/DailyView';
import WeeklyView from './calendar/WeeklyView';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Json } from "@/integrations/supabase/types";

const MAX_CALENDAR_DAYS = 90;

interface AppointmentClient {
  name: string;
  email: string;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  client_id: string;
  status: string;
  client: AppointmentClient;
}

// Define an interface for cabin availability
interface CabinAvailability {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

// Define interface for cabin details from Supabase
interface CabinDetails {
  id: string;
  name: string;
  description: string | null;
  availability: CabinAvailability;
  equipment: string[] | null;
  image_url: string | null;
  location_id: string | null;
  pricing: Record<string, any> | null;
  updated_at: string;
  created_at: string;
  locations?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
}

// Define interface for raw appointment data from Supabase
interface RawAppointmentData {
  id: string;
  date: string;
  time: string;
  client_id: string;
  status: string;
  professional_id: string;
  cabin_id?: string;
}

// Define interface for profile data from Supabase
interface ProfileData {
  name: string | null;
  email: string | null;
  created_at?: string;
}

const AvailabilityCalendar = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const cabinId = searchParams.get('cabin');
  const locationId = searchParams.get('location');
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { availability, updateAvailability } = useAvailability(user?.id);
  const { workingHours, breakTime } = useWorkingHours(user?.id);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");

  // Fetch cabin details if cabin ID is provided
  const { data: cabinData } = useQuery({
    queryKey: ['cabin-details', cabinId],
    queryFn: async () => {
      if (!cabinId) return null;
      
      const { data, error } = await supabase
        .from('cabins')
        .select('*, locations(*)')
        .eq('id', cabinId)
        .single();

      if (error) {
        console.error('Error fetching cabin details:', error);
        return null;
      }
      
      // Convert data to our CabinDetails type with proper type checking
      const cabinDetails: CabinDetails = {
        id: data.id,
        name: data.name,
        description: data.description,
        availability: parseAvailability(data.availability),
        equipment: data.equipment || [],
        image_url: data.image_url,
        location_id: data.location_id,
        pricing: parsePricing(data.pricing),
        updated_at: data.updated_at,
        created_at: data.created_at,
        locations: data.locations
      };
      
      return cabinDetails;
    },
    enabled: !!cabinId,
  });

  // Helper function to safely parse availability data
  const parseAvailability = (data: unknown): CabinAvailability => {
    // Default availability if parsing fails
    const defaultAvailability: CabinAvailability = {
      morning: true,
      afternoon: true,
      evening: true
    };
    
    if (!data) return defaultAvailability;
    
    try {
      // Handle string JSON
      if (typeof data === 'string') {
        const parsed = JSON.parse(data);
        // Verify the parsed object has required fields
        if (typeof parsed === 'object' && parsed !== null &&
            'morning' in parsed && 'afternoon' in parsed && 'evening' in parsed) {
          return {
            morning: Boolean(parsed.morning),
            afternoon: Boolean(parsed.afternoon),
            evening: Boolean(parsed.evening)
          };
        }
      } 
      // Handle object
      else if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        if ('morning' in obj && 'afternoon' in obj && 'evening' in obj) {
          return {
            morning: Boolean(obj.morning),
            afternoon: Boolean(obj.afternoon),
            evening: Boolean(obj.evening)
          };
        }
      }
    } catch (e) {
      console.error("Error parsing cabin availability:", e);
    }
    
    return defaultAvailability;
  };
  
  // Helper function to safely parse pricing data
  const parsePricing = (data: unknown): Record<string, any> => {
    if (!data) return {};
    
    try {
      if (typeof data === 'string') {
        return JSON.parse(data);
      } else if (data && typeof data === 'object') {
        return data as Record<string, any>;
      }
    } catch (e) {
      console.error("Error parsing cabin pricing:", e);
    }
    
    return {};
  };

  // Fetch user profile to get creation date
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data as ProfileData;
    },
    enabled: !!user?.id,
  });

  // Set initial selected date based on user creation date or default to today
  useEffect(() => {
    if (userProfile?.created_at) {
      setSelectedDate(parseISO(userProfile.created_at));
    } else {
      setSelectedDate(new Date());
    }
  }, [userProfile]);

  // Calculate date limits for the calendar
  const getDateLimits = (): { startDate: Date, endDate: Date } => {
    const today = new Date();
    const endDate = addDays(today, MAX_CALENDAR_DAYS);
    
    // Use the user's creation date as the start if available, otherwise use today
    const startDate = userProfile?.created_at ? 
      parseISO(userProfile.created_at) : today;
      
    return { startDate, endDate };
  };

  // Simplified function to fetch appointments with explicit types
  const fetchAppointments = async (): Promise<Appointment[]> => {
    if (!user?.id) return [];
    
    const { startDate, endDate } = getDateLimits();
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');
    
    // Base query with date limits
    let query = supabase
      .from('appointments')
      .select('*')
      .eq('professional_id', user.id)
      .gte('date', startDateStr) 
      .lte('date', endDateStr);
    
    // If cabin ID is provided, filter by it
    if (cabinId) {
      query = query.eq('cabin_id', cabinId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    // Safely cast the data
    const rawAppointments = data as RawAppointmentData[];
    
    // Create a list to store the processed appointments
    const appointmentsWithClients: Appointment[] = [];
    
    // Process each appointment individually to avoid deep nesting
    for (const appointment of rawAppointments) {
      let client: AppointmentClient = { 
        name: 'Cliente não especificado', 
        email: '' 
      };
      
      if (appointment.client_id) {
        const { data: clientData } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', appointment.client_id)
          .single();
        
        if (clientData) {
          client = {
            name: clientData.name || 'Nome não disponível',
            email: clientData.email || 'Email não disponível'
          };
        }
      }
      
      // Create a clean appointment object with explicit structure
      const processedAppointment: Appointment = {
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        client_id: appointment.client_id,
        status: appointment.status,
        client: client
      };
      
      appointmentsWithClients.push(processedAppointment);
    }

    return appointmentsWithClients;
  };

  // Use the simplified fetch function in the query
  const { data: appointments = [] } = useQuery({
    queryKey: ['professional-appointments', user?.id, cabinId],
    queryFn: fetchAppointments,
    enabled: !!user?.id
  });

  // Filter appointments for a specific day
  const getAppointmentsForDay = (date: Date): Appointment[] => {
    const { startDate, endDate } = getDateLimits();
    
    // Only return appointments within the allowed date range
    if (isBefore(date, startDate) || isAfter(date, endDate)) {
      return [];
    }
    
    return (appointments || []).filter(app => 
      isSameDay(new Date(app.date), date)
    );
  };

  const formatAppointmentTime = (time: string): string => {
    return format(new Date(`2000-01-01T${time}`), 'HH:mm');
  };

  const handleShiftStatusChange = async (date: Date, shift: 'morning' | 'afternoon' | 'evening', newStatus: ShiftStatus): Promise<void> => {
    try {
      await updateAvailability.mutateAsync({ date, shift, status: newStatus });
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const getShiftStatus = (date: Date, shift: 'morning' | 'afternoon' | 'evening'): ShiftStatus => {
    const dayAvail = availability.find(a => isSameDay(a.date, date));
    if (!dayAvail) return 'free';
    return dayAvail[`${shift}_status` as keyof typeof dayAvail] as ShiftStatus;
  };

  const handleDateChange = (newDate: Date): void => {
    // Check if the date is within limits
    const { startDate, endDate } = getDateLimits();
    
    if (isBefore(newDate, startDate)) {
      console.warn('Data selecionada está antes da data de início permitida');
      setSelectedDate(startDate);
      return;
    }
    
    if (isAfter(newDate, endDate)) {
      console.warn('Data selecionada está após a data final permitida');
      setSelectedDate(endDate);
      return;
    }
    
    setSelectedDate(newDate);
  };

  // Helper function to safely check cabin availability
  const getCabinShiftAvailability = (shift: 'morning' | 'afternoon' | 'evening'): boolean => {
    if (!cabinData || !cabinData.availability) return false;
    
    const availability = cabinData.availability;
    return !!availability[shift];
  };

  if (!selectedDate) {
    return <div>Carregando...</div>;
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-4 flex flex-col space-y-6">
        {cabinData && (
          <div className="bg-muted p-4 rounded-lg">
            <h2 className="text-xl font-bold">Reservando Cabine: {cabinData.name}</h2>
            {cabinData.locations && (
              <p className="text-sm text-muted-foreground">
                Local: {cabinData.locations.name}, {cabinData.locations.city} - {cabinData.locations.state}
              </p>
            )}
            <p className="mt-2">{cabinData.description}</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="font-medium">Manhã</div>
                <div>{getCabinShiftAvailability('morning') ? 
                  <span className="text-green-600">Disponível</span> : 
                  <span className="text-red-500">Indisponível</span>}</div>
              </div>
              <div>
                <div className="font-medium">Tarde</div>
                <div>{getCabinShiftAvailability('afternoon') ? 
                  <span className="text-green-600">Disponível</span> : 
                  <span className="text-red-500">Indisponível</span>}</div>
              </div>
              <div>
                <div className="font-medium">Noite</div>
                <div>{getCabinShiftAvailability('evening') ? 
                  <span className="text-green-600">Disponível</span> : 
                  <span className="text-red-500">Indisponível</span>}</div>
              </div>
            </div>
          </div>
        )}

        <WorkingHoursSettings />

        <div className="flex justify-center mb-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "weekly" | "daily")}>
            <ToggleGroupItem value="weekly">Semanal</ToggleGroupItem>
            <ToggleGroupItem value="daily">Diário</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-8">
          {viewMode === "weekly" ? (
            <Card>
              <CardContent className="p-0">
                <WeeklyView
                  selectedDate={selectedDate}
                  appointments={appointments}
                  onDateChange={handleDateChange}
                  workingHours={workingHours}
                  breakTime={breakTime}
                  createdAt={userProfile?.created_at}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <DailyView
                  selectedDate={selectedDate}
                  appointments={appointments}
                  onDateChange={handleDateChange}
                  workingHours={workingHours}
                  breakTime={breakTime}
                  createdAt={userProfile?.created_at}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Data e Hora</p>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.date), "dd/MM/yyyy")} às{' '}
                    {formatAppointmentTime(selectedAppointment.time)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Cliente</p>
                  <p className="font-medium">{selectedAppointment.client.name}</p>
                  <p className="text-sm text-gray-600">{selectedAppointment.client.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{selectedAppointment.status}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
