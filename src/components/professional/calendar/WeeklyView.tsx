import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addWeeks, subWeeks, addDays, startOfWeek, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/lib/auth";
import { useWorkingHours } from "@/hooks/useWorkingHours";

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
  const { events, generateTimeSlots } = useCalendarEvents(user?.id, selectedDate);
  const { workingHours: workingHoursSettings, breakTime } = useWorkingHours(user?.id);
  
  const timeSlots = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    .filter(date => {
      if (createdAt) {
        const creationDate = parseISO(createdAt);
        return !isBefore(date, creationDate);
      }
      return true;
    });

  const getWorkingHourRange = () => {
    if (!workingHoursSettings) return Array.from({ length: 9 }, (_, i) => i + 8);
    
    let earliestStart = 23;
    let latestEnd = 0;
    
    Object.values(workingHoursSettings).forEach(day => {
      if (day.enabled) {
        const startHour = parseInt(day.start.split(':')[0]);
        const endHour = parseInt(day.end.split(':')[0]);
        
        if (startHour < earliestStart) earliestStart = startHour;
        if (endHour > latestEnd) latestEnd = endHour;
      }
    });
    
    return Array.from(
      { length: latestEnd - earliestStart }, 
      (_, i) => i + earliestStart
    );
  };

  const hoursList = getWorkingHourRange();

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

  const isDuringBreak = (hour: number) => {
    if (!breakTime?.enabled) return false;
    
    const breakStartHour = parseInt(breakTime.start.split(':')[0]);
    const breakEndHour = parseInt(breakTime.end.split(':')[0]);
    
    return hour >= breakStartHour && hour < breakEndHour;
  };

  const isWithinWorkingHours = (date: Date, hour: number) => {
    if (!workingHoursSettings) return false;
    
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase();
    const daySettings = workingHoursSettings[dayName];
    
    if (!daySettings?.enabled) return false;
    
    const startHour = parseInt(daySettings.start.split(':')[0]);
    const endHour = parseInt(daySettings.end.split(':')[0]);
    
    return hour >= startHour && hour < endHour;
  };

  const getCellStatus = (date: Date, hour: number) => {
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase();
    
    if (!workingHoursSettings || !workingHoursSettings[dayName] || !workingHoursSettings[dayName].enabled) {
      return { status: 'closed', color: 'bg-gray-100', label: 'Indisponível' };
    }
    
    if (!isWithinWorkingHours(date, hour)) {
      return { status: 'closed', color: 'bg-gray-100', label: 'Fora do Horário' };
    }
    
    if (isDuringBreak(hour)) {
      return { status: 'lunch', color: 'bg-amber-100', label: 'Almoço' };
    }
    
    const cellTimeDate = new Date(date);
    const cellTime = new Date(cellTimeDate.setHours(hour, 0, 0, 0));
    
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
              {timeSlots.map((timeSlot) => (
                <div
                  key={timeSlot}
                  className="h-3 text-[10px] font-medium text-muted-foreground flex items-center justify-end pr-2"
                >
                  {timeSlot}
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
                {generateTimeSlots(date).map((slot, index) => {
                  const isLunchHour = isDuringBreak(new Date(slot.time).getHours());
                  const cellStatus = getCellStatus(date, new Date(slot.time).getHours());
                  
                  return (
                    <Card
                      key={index}
                      className={`h-3 ${isLunchHour ? 'bg-amber-100' : cellStatus.color} relative`}
                    >
                      <CardContent className="p-0.5 h-full">
                        {slot.events.length > 0 && (
                          <div className="absolute inset-0 bg-primary/10" title={slot.events[0].title} />
                        )}
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
