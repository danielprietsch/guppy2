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

type ShiftStatus = 'free' | 'busy' | 'closed';

interface DayAvailability {
  date: Date;
  morning: ShiftStatus;
  afternoon: ShiftStatus;
  evening: ShiftStatus;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  client_id: string;
  status: string;
  client: {
    name: string;
    email: string;
  };
}

interface AvailabilityCalendarProps {
  initialAvailability?: DayAvailability[];
}

const generateMockAvailability = (startDate: Date, days: number): DayAvailability[] => {
  const availability: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const isSunday = date.getDay() === 0;
    const isMonday = date.getDay() === 1;
    
    availability.push({
      date: new Date(date),
      morning: isSunday ? 'closed' : isMonday ? 'busy' : Math.random() > 0.3 ? 'free' : 'busy',
      afternoon: isSunday ? 'closed' : Math.random() > 0.5 ? 'free' : 'busy',
      evening: isSunday ? 'closed' : Math.random() > 0.7 ? 'free' : 'busy',
    });
  }
  return availability;
};

const AvailabilityCalendar = ({ initialAvailability }: AvailabilityCalendarProps) => {
  const { user } = useAuth();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availability, setAvailability] = useState<DayAvailability[]>(
    initialAvailability || generateMockAvailability(today, 30)
  );

  const { data: appointments } = useQuery({
    queryKey: ['professional-appointments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:client_id (
            name,
            email
          )
        `)
        .eq('professional_id', user.id);

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return data as Appointment[];
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

  const dayClass = (day: Date, availability: DayAvailability[]) => {
    const dayAppointments = getAppointmentsForDay(day);
    const dayAvail = availability.find(a => isSameDay(a.date, day));
    
    let className = "relative h-full w-full ";
    
    if (dayAppointments.length > 0) {
      className += "bg-blue-50 ";
    } else if (dayAvail) {
      if (dayAvail.morning === 'closed' && dayAvail.afternoon === 'closed' && dayAvail.evening === 'closed') {
        className += "bg-amber-100 ";
      } else if (dayAvail.morning === 'busy' && dayAvail.afternoon === 'busy' && dayAvail.evening === 'busy') {
        className += "bg-red-100 ";
      } else if (dayAvail.morning === 'free' && dayAvail.afternoon === 'free' && dayAvail.evening === 'free') {
        className += "bg-green-100 ";
      } else {
        className += "bg-gradient-to-br from-green-100 via-white to-amber-100 ";
      }
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
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              showOutsideDays
              className="border rounded-md p-3"
              components={{
                DayContent: ({ date }) => (
                  <div className={dayClass(date, availability)}>
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
                        {formatAppointmentTime(app.time)}
                      </div>
                    ))}
                  </div>
                )
              }}
            />
          </div>
          
          <div>
            {selectedDate && (
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-4">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h3>
                <div className="space-y-2">
                  {getAppointmentsForDay(selectedDate).map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100"
                      onClick={() => setSelectedAppointment(app)}
                    >
                      <div>
                        <p className="font-medium">{formatAppointmentTime(app.time)}</p>
                        <p className="text-sm text-gray-600">{app.client.name}</p>
                      </div>
                    </div>
                  ))}
                  {getAppointmentsForDay(selectedDate).length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum agendamento para este dia
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
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
