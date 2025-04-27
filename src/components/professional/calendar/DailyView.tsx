
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays, subDays, startOfDay, parseISO, isBefore, isToday } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/lib/auth";
import { useWorkingHours } from "@/hooks/useWorkingHours";

interface DailyViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  createdAt?: string;
}

const DailyView = ({ 
  selectedDate, 
  onDateChange,
  createdAt 
}: DailyViewProps) => {
  const { user } = useAuth();
  const { events, isLoading } = useCalendarEvents(user?.id, selectedDate);
  const { workingHours: workingHoursSettings, breakTime } = useWorkingHours(user?.id);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handlePreviousDay = () => {
    const newDate = subDays(selectedDate, 1);
    
    if (createdAt) {
      const creationDate = parseISO(createdAt);
      if (isBefore(startOfDay(newDate), startOfDay(creationDate))) {
        return; 
      }
    }
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  // Check if a given hour is during break time
  const isDuringBreak = (hour: number) => {
    if (!breakTime?.enabled) return false;
    
    const breakStartHour = parseInt(breakTime.start.split(':')[0]);
    const breakEndHour = parseInt(breakTime.end.split(':')[0]);
    
    return hour >= breakStartHour && hour < breakEndHour;
  };

  // Check if a given hour is within working hours for a specific day
  const isWithinWorkingHours = (date: Date, hour: number) => {
    if (!workingHoursSettings) return false;
    
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase();
    const daySettings = workingHoursSettings[dayName];
    
    // If day is not enabled or has no settings, it's not within working hours
    if (!daySettings?.enabled) return false;
    
    const startHour = parseInt(daySettings.start.split(':')[0]);
    const endHour = parseInt(daySettings.end.split(':')[0]);
    
    // Check if hour is within working hours
    return hour >= startHour && hour < endHour;
  };

  const getHourStatus = (hour: number) => {
    // Primeiro verificar se está dentro do horário de trabalho
    if (!isWithinWorkingHours(selectedDate, hour)) {
      return { status: 'closed', color: 'bg-gray-100', label: 'Fora do Horário' };
    }

    // Verificar se é horário de almoço
    if (isDuringBreak(hour)) {
      return { status: 'lunch', color: 'bg-amber-100', label: 'Almoço' };
    }

    // Create a date object for the current hour
    const hourDate = new Date(selectedDate);
    hourDate.setHours(hour, 0, 0, 0);
    
    // Check if there are any events at this exact time
    const hourEvents = events.filter(event => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return eventStart <= hourDate && eventEnd > hourDate;
    });

    if (hourEvents.length > 0) {
      const mainEvent = hourEvents[0];
      switch (mainEvent.event_type) {
        case 'appointment':
          return { status: 'scheduled', color: 'bg-red-100', label: 'Agendado' };
        case 'booking':
          return { status: 'scheduled', color: 'bg-orange-100', label: 'Reservado' };
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
        <Button variant="ghost" size="sm" onClick={handlePreviousDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-base sm:text-lg font-semibold">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </div>
        <Button variant="ghost" size="sm" onClick={handleNextDay}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-2 p-4">
          {hours.map((hour) => {
            const hourStatus = getHourStatus(hour);
            const isLunchHour = isDuringBreak(hour);
            
            // Create a date object for the current hour
            const hourDate = new Date(selectedDate);
            hourDate.setHours(hour, 0, 0, 0);
            
            // Filter events for this specific hour
            const hourEvents = events.filter(event => {
              const eventStart = new Date(event.start_time);
              const eventEnd = new Date(event.end_time);
              return eventStart <= hourDate && eventEnd > hourDate;
            });
            
            return (
              <Card key={hour} className="border shadow-sm">
                <CardContent className="p-3">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2 text-sm font-medium text-muted-foreground flex items-center">
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </div>
                    <div className={`col-span-10 min-h-[3rem] rounded-md ${isLunchHour ? 'bg-amber-100' : hourStatus.color} relative p-2`}>
                      <div className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full bg-white/90">
                        {isLunchHour ? 'Almoço' : hourStatus.label}
                      </div>
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          className="mt-2 p-2 bg-primary/10 rounded-md text-sm"
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DailyView;
