
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isSameDay, parseISO } from "date-fns";
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

// Define an interface for cabin availability to avoid type errors
interface CabinAvailability {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

interface CabinDetails {
  id: string;
  name: string;
  description: string;
  availability: CabinAvailability;
  locations?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
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
      
      return data as CabinDetails;
    },
    enabled: !!cabinId,
  });

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
      
      return data;
    },
  });

  // Set initial selected date based on user creation date or default to today
  useEffect(() => {
    if (userProfile?.created_at) {
      setSelectedDate(parseISO(userProfile.created_at));
    } else {
      setSelectedDate(new Date());
    }
  }, [userProfile]);

  const { data: appointments = [] } = useQuery({
    queryKey: ['professional-appointments', user?.id, cabinId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Base query
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', user.id);
      
      // Se temos um ID de cabine, filtrar por ele
      if (cabinId) {
        query = query.eq('cabin_id', cabinId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      const appointmentsWithClients = await Promise.all(
        data.map(async (appointment) => {
          if (appointment.client_id) {
            const { data: clientData, error: clientError } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', appointment.client_id)
              .single();
            
            if (clientError || !clientData) {
              console.error('Error fetching client:', clientError);
              return {
                ...appointment,
                client: { name: 'Cliente não encontrado', email: '' }
              };
            }
            
            return {
              ...appointment,
              client: {
                name: clientData.name || 'Nome não disponível',
                email: clientData.email || 'Email não disponível'
              }
            };
          }
          
          return {
            ...appointment,
            client: { name: 'Cliente não especificado', email: '' }
          };
        })
      );

      return appointmentsWithClients as Appointment[];
    },
  });

  const getAppointmentsForDay = (date: Date) => {
    return appointments?.filter(app => 
      isSameDay(new Date(app.date), date)
    ) || [];
  };

  const formatAppointmentTime = (time: string) => {
    return format(new Date(`2000-01-01T${time}`), 'HH:mm');
  };

  const handleShiftStatusChange = async (date: Date, shift: 'morning' | 'afternoon' | 'evening', newStatus: ShiftStatus) => {
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

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  // Helper function to safely check cabin availability
  const getCabinShiftAvailability = (shift: 'morning' | 'afternoon' | 'evening'): boolean => {
    if (!cabinData || !cabinData.availability) return false;
    
    // Type casting to access the properties safely
    const cabinAvailability = cabinData.availability as CabinAvailability;
    return cabinAvailability[shift] || false;
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
                  appointments={appointments || []}
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
                  appointments={appointments || []}
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
