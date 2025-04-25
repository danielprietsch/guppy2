
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

const AvailabilityCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { availability, updateAvailability } = useAvailability(user?.id);
  const { workingHours, breakTime } = useWorkingHours(user?.id);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");

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
    queryKey: ['professional-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', user.id);

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

  if (!selectedDate) {
    return <div>Carregando...</div>;
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-4 flex flex-col space-y-6">
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
