import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
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
import WorkingHoursSettings from './WorkingHoursSettings';
import DailyView from './calendar/DailyView';
import WeeklyView from './calendar/WeeklyView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { availability, updateAvailability } = useAvailability(user?.id);

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

  const dayClass = (date: Date) => {
    const dayAppointments = getAppointmentsForDay(date);
    const morning = getShiftStatus(date, 'morning');
    const afternoon = getShiftStatus(date, 'afternoon');
    const evening = getShiftStatus(date, 'evening');
    
    let className = "relative h-full w-full ";
    
    if (dayAppointments.length > 0) {
      className += "bg-blue-50 ";
    } else if (morning === 'closed' && afternoon === 'closed' && evening === 'closed') {
      className += "bg-amber-100 ";
    } else if (morning === 'busy' && afternoon === 'busy' && evening === 'busy') {
      className += "bg-red-100 ";
    } else if (morning === 'free' && afternoon === 'free' && evening === 'free') {
      className += "bg-green-100 ";
    } else {
      className += "bg-gradient-to-br from-green-100 via-white to-amber-100 ";
    }

    return className;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendário de Disponibilidade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Tabs defaultValue="day" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
            <TabsContent value="day">
              <DailyView 
                selectedDate={selectedDate || today}
                appointments={appointments || []}
              />
            </TabsContent>
            <TabsContent value="week">
              <WeeklyView 
                selectedDate={selectedDate || today}
                appointments={appointments || []}
              />
            </TabsContent>
            <TabsContent value="month">
              <div className="mb-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  showOutsideDays
                  className="border rounded-md p-3 w-full"
                  components={{
                    DayContent: ({ date }) => (
                      <div className={dayClass(date)}>
                        <div className="text-center">{date.getDate()}</div>
                        {getAppointmentsForDay(date).map((app, idx) => (
                          <div
                            key={app.id}
                            className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-xs bg-blue-200 cursor-pointer truncate"
                            style={{ bottom: `${idx * 18}px` }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedAppointment(app);
                            }}
                          >
                            {format(new Date(`2000-01-01T${app.time}`), 'HH:mm')}
                          </div>
                        ))}
                      </div>
                    )
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>

          <WorkingHoursSettings />

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
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
