
import React, { useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addWeeks, subWeeks, addDays, startOfWeek, parseISO, isBefore, startOfDay } from "date-fns";
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
  const { events, toggleSlotAvailability } = useCalendarEvents(user?.id, selectedDate);
  const { workingHours: workingHoursSettings, breakTime } = useWorkingHours(user?.id);
  
  const getWorkingHourRange = useCallback(() => {
    if (!workingHoursSettings) return { startHour: 8, endHour: 17 };
    
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
    
    return { startHour: earliestStart, endHour: latestEnd };
  }, [workingHoursSettings]);

  const { startHour, endHour } = getWorkingHourRange();
  
  const timeSlots = Array.from(
    { length: (endHour - startHour) * 4 }, 
    (_, i) => {
      const hour = Math.floor(i / 4) + startHour;
      const minutes = (i % 4) * 15;
      return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  );

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    .filter(date => {
      if (createdAt) {
        const creationDate = parseISO(createdAt);
        return !isBefore(date, creationDate);
      }
      return true;
    });

  const handleSlotClick = async (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    
    await toggleSlotAvailability(slotDate);
  };

  const getCellStatus = (date: Date, hour: number, minutes: number) => {
    const dayName = format(date, 'EEEE', { locale: ptBR }).toLowerCase();
    const slotTime = new Date(date);
    slotTime.setHours(hour, minutes, 0, 0);
    
    if (!workingHoursSettings || !workingHoursSettings[dayName]?.enabled) {
      return { status: 'closed', color: 'bg-gray-100', label: 'Indisponível' };
    }
    
    const daySettings = workingHoursSettings[dayName];
    const startHour = parseInt(daySettings.start.split(':')[0]);
    const endHour = parseInt(daySettings.end.split(':')[0]);
    
    if (hour < startHour || hour >= endHour) {
      return { status: 'closed', color: 'bg-gray-100', label: 'Fora do Horário' };
    }
    
    if (breakTime?.enabled) {
      const breakStartHour = parseInt(breakTime.start.split(':')[0]);
      const breakEndHour = parseInt(breakTime.end.split(':')[0]);
      if (hour >= breakStartHour && hour < breakEndHour) {
        return { status: 'lunch', color: 'bg-amber-100', label: 'Almoço' };
      }
    }
    
    const cellEvents = events.filter(event => {
      if (!event) return false;
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);
      return slotTime >= eventStart && slotTime < eventEnd;
    });

    if (cellEvents.length > 0) {
      const mainEvent = cellEvents[0];
      switch (mainEvent.event_type) {
        case 'appointment':
          return { status: 'scheduled', color: 'bg-red-100', label: 'Agendamento' };
        case 'availability_block':
          return { status: 'busy', color: 'bg-red-100', label: 'Indisponível' };
        default:
          return { status: 'scheduled', color: 'bg-blue-100', label: mainEvent.title };
      }
    }

    return { status: 'free', color: 'bg-green-100 hover:bg-green-200 cursor-pointer', label: 'Livre' };
  };

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
          <div className="grid grid-cols-8 gap-1">
            {/* Coluna de horários com alinhamento vertical corrigido */}
            <div>
              {/* Card vazio para alinhar com os cabeçalhos dos dias */}
              <Card className="invisible h-[72px]">
                <CardContent className="p-0 h-full" />
              </Card>
              
              {/* Lista de horários agora corretamente alinhada com as células */}
              {timeSlots.map((timeSlot) => (
                <div
                  key={timeSlot}
                  className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground"
                  style={{ height: "1.5rem", marginBottom: "1px" }}
                >
                  {timeSlot}
                </div>
              ))}
            </div>

            {/* Colunas de dias da semana */}
            {weekDays.map((date) => (
              <div key={date.toString()} className="space-y-1">
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
                
                {/* Time slots com altura fixa e margem inferior consistente */}
                {timeSlots.map((timeSlot) => {
                  const [hours, minutes] = timeSlot.split(':').map(Number);
                  const cellStatus = getCellStatus(date, hours, minutes);
                  
                  return (
                    <Card
                      key={`${date.toString()}-${timeSlot}`}
                      className={`${cellStatus.color} transition-colors`}
                      style={{ height: "1.5rem", marginBottom: "1px" }}
                      onClick={() => cellStatus.status === 'free' && handleSlotClick(date, timeSlot)}
                      title={cellStatus.label}
                    >
                      <CardContent className="p-0 h-full" />
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
