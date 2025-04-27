
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addWeeks, subWeeks, addDays, startOfWeek, startOfDay, parseISO, isBefore } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/lib/auth";

interface WeeklyViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  createdAt?: string;
}

const WeeklyView = ({ 
  selectedDate, 
  onDateChange,
  createdAt
}: WeeklyViewProps) => {
  const { user } = useAuth();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const { events, isLoading, isWithinWorkingHours } = useCalendarEvents(user?.id, selectedDate);
  
  // Filtrar apenas os dias da semana (segunda a sexta)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    .filter(date => {
      // Verificar se a data está após a data de criação (se fornecida)
      if (createdAt) {
        const creationDate = parseISO(createdAt);
        return !isBefore(date, creationDate);
      }
      return true;
    });

  // Definir horário de trabalho das 8h às 17h
  const workingHours = Array.from({ length: 10 }, (_, i) => i + 8);

  const handlePreviousWeek = () => {
    const newDate = subWeeks(selectedDate, 1);
    
    if (createdAt) {
      const creationDate = parseISO(createdAt);
      if (isBefore(startOfDay(newDate), startOfDay(creationDate))) {
        return;
      }
    }
    onDateChange(newDate);
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(selectedDate, 1));
  };

  const getCellStatus = (date: Date, hour: number) => {
    // Verificar se está dentro do horário de trabalho
    if (!isWithinWorkingHours(date, hour)) {
      return { status: 'closed', color: 'bg-gray-100', label: 'Fora do Horário' };
    }
    
    // Verificar se é horário de almoço (12h às 13h)
    if (hour === 12) {
      return { status: 'lunch', color: 'bg-amber-100', label: 'Almoço' };
    }
    
    const cellTime = new Date(date.setHours(hour, 0, 0, 0));
    
    const cellEvents = events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return eventStart <= cellTime && eventEnd > cellTime;
    });

    if (cellEvents.length > 0) {
      const mainEvent = cellEvents[0];
      switch (mainEvent.event_type) {
        case 'appointment':
          return { status: 'scheduled', color: 'bg-red-100', label: 'Agendamento' };
        case 'booking':
          return { status: 'scheduled', color: 'bg-orange-100', label: 'Reserva' };
        case 'availability_block':
          return mainEvent.status === 'confirmed' 
            ? { status: 'busy', color: 'bg-red-100', label: 'Ocupado' }
            : { status: 'tentative', color: 'bg-yellow-100', label: 'Provisório' };
        default:
          return { status: 'scheduled', color: 'bg-blue-100', label: mainEvent.title };
      }
    }

    return { status: 'free', color: 'bg-green-100', label: 'Livre' };
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-background sticky top-0 z-10 border-b">
        <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-base sm:text-lg font-semibold">
          {format(weekStart, "MMMM yyyy", { locale: ptBR })}
        </div>
        <Button variant="ghost" size="sm" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="min-w-[800px] p-4">
          <div className="grid grid-cols-8 gap-4">
            <div className="pt-10">
              {workingHours.map((hour) => (
                <div
                  key={hour}
                  className="h-12 text-sm font-medium text-muted-foreground flex items-center justify-end pr-2"
                >
                  {`${hour.toString().padStart(2, '0')}:00`}
                </div>
              ))}
            </div>

            {weekDays.map((date) => (
              <div key={date.toString()} className="space-y-2">
                <Card className={`text-center p-2 bg-background ${
                  format(date, 'EEEE', { locale: ptBR }) === 'sábado' || 
                  format(date, 'EEEE', { locale: ptBR }) === 'domingo' ? 'bg-gray-50' : ''
                }`}>
                  <div className="font-semibold capitalize">
                    {format(date, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(date, 'd MMM', { locale: ptBR })}
                  </div>
                </Card>
                {workingHours.map((hour) => {
                  const cellStatus = getCellStatus(date, hour);
                  const cellEvents = events.filter(event => {
                    const eventStart = new Date(event.start_time);
                    const eventHour = eventStart.getHours();
                    return format(eventStart, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
                           eventHour === hour;
                  });

                  const isWeekend = format(date, 'EEEE', { locale: ptBR }) === 'sábado' || 
                                    format(date, 'EEEE', { locale: ptBR }) === 'domingo';

                  return (
                    <Card
                      key={hour}
                      className={`h-12 ${isWeekend ? 'bg-gray-50' : cellStatus.color} relative ${
                        hour === 12 ? 'bg-amber-100' : ''
                      }`}
                    >
                      <CardContent className="p-1 h-full">
                        <div className="absolute top-0 right-0 text-[10px] font-medium px-1.5 py-0.5 rounded-bl bg-white/90">
                          {hour === 12 ? 'Almoço' : cellStatus.label}
                        </div>
                        {cellEvents.map((event) => (
                          <div
                            key={event.id}
                            className="text-[10px] p-1 bg-primary/10 rounded-sm truncate mt-1"
                            title={event.description || event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyView;
