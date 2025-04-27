
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addWeeks, subWeeks, addDays, startOfWeek, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useAuth } from "@/lib/auth";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const { events, toggleSlotAvailability, isLoading: eventsLoading } = useCalendarEvents(user?.id, selectedDate);
  const { workingHours: workingHoursSettings, breakTime, isLoading: workingHoursLoading } = useWorkingHours(user?.id);
  
  const getWorkingHourRange = useCallback(() => {
    if (!workingHoursSettings) return { startHour: 8, endHour: 18 };
    
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
    
    // Ensure we have reasonable defaults if no working hours are enabled
    if (earliestStart === 23) earliestStart = 8;
    if (latestEnd === 0) latestEnd = 18;
    
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
        return !isBefore(date, startOfDay(creationDate));
      }
      return true;
    });

  const handleSlotClick = async (date: Date, timeSlot: string, status: string) => {
    if (status !== 'free' && status !== 'manually_closed') {
      if (status === 'closed') {
        toast({
          title: "Horário indisponível",
          description: "Este horário está fora do seu horário de trabalho configurado",
          variant: "destructive"
        });
      } else if (status === 'lunch') {
        toast({
          title: "Horário de pausa",
          description: "Este horário está configurado como horário de pausa/almoço",
          variant: "destructive"
        });
      } else if (status === 'scheduled') {
        toast({
          title: "Horário ocupado",
          description: "Este horário já tem um compromisso agendado",
          variant: "destructive"
        });
      }
      return;
    }
    
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
      return { status: 'closed', color: 'bg-gray-200 cursor-not-allowed', label: 'Fora do horário' };
    }
    
    const daySettings = workingHoursSettings[dayName];
    const startHour = parseInt(daySettings.start.split(':')[0]);
    const startMinutes = parseInt(daySettings.start.split(':')[1]);
    const endHour = parseInt(daySettings.end.split(':')[0]);
    const endMinutes = parseInt(daySettings.end.split(':')[1]);
    
    // Check if time slot is before start hour or after end hour
    if (hour < startHour || (hour === startHour && minutes < startMinutes) || 
        hour > endHour || (hour === endHour && minutes >= endMinutes)) {
      return { status: 'closed', color: 'bg-gray-200 cursor-not-allowed', label: 'Fora do horário' };
    }
    
    // Check if time slot is during break time
    if (breakTime?.enabled) {
      const breakStartHour = parseInt(breakTime.start.split(':')[0]);
      const breakStartMinutes = parseInt(breakTime.start.split(':')[1]);
      const breakEndHour = parseInt(breakTime.end.split(':')[0]);
      const breakEndMinutes = parseInt(breakTime.end.split(':')[1]);
      
      const isAfterBreakStart = hour > breakStartHour || (hour === breakStartHour && minutes >= breakStartMinutes);
      const isBeforeBreakEnd = hour < breakEndHour || (hour === breakEndHour && minutes < breakEndMinutes);
      
      if (isAfterBreakStart && isBeforeBreakEnd) {
        return { status: 'lunch', color: 'bg-gray-200 cursor-not-allowed', label: 'Horário de almoço' };
      }
    }
    
    // Check if there are events for this time slot
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
          return { status: 'scheduled', color: 'bg-red-500 text-white cursor-not-allowed', label: 'Ocupado' };
        case 'availability_block':
          return { status: 'manually_closed', color: 'bg-yellow-300 text-black cursor-pointer hover:bg-yellow-400', label: 'Fechado manualmente' };
        default:
          return { status: 'scheduled', color: 'bg-red-500 text-white cursor-not-allowed', label: 'Ocupado' };
      }
    }

    return { status: 'free', color: 'bg-green-500 hover:bg-green-600 cursor-pointer text-white', label: 'Disponível' };
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

  if (eventsLoading || workingHoursLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando disponibilidade...</p>
      </div>
    );
  }

  const headerHeight = 72;
  const slotHeight = 24;
  const slotMargin = 1;

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
            <div className="flex flex-col">
              <div className="h-[72px] flex items-end pb-1">
                <div className="w-full text-right pr-2 text-xs font-medium text-muted-foreground opacity-0">
                  00:00
                </div>
              </div>
              {timeSlots.map((timeSlot) => (
                <div
                  key={timeSlot}
                  className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground"
                  style={{ 
                    height: `${slotHeight}px`, 
                    marginBottom: `${slotMargin}px` 
                  }}
                >
                  {timeSlot}
                </div>
              ))}
            </div>
            {weekDays.map((date) => (
              <div key={date.toString()} className="flex flex-col space-y-1">
                <Card className="text-center p-2 bg-background h-[72px]">
                  <div className="font-semibold capitalize">
                    {format(date, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(date, 'd MMM', { locale: ptBR })}
                  </div>
                </Card>
                {timeSlots.map((timeSlot) => {
                  const [hours, minutes] = timeSlot.split(':').map(Number);
                  const cellStatus = getCellStatus(date, hours, minutes);
                  
                  return (
                    <div
                      key={`${date.toString()}-${timeSlot}`}
                      className={`${cellStatus.color} rounded transition-colors flex items-center justify-center`}
                      onClick={() => handleSlotClick(date, timeSlot, cellStatus.status)}
                      title={cellStatus.label}
                      role="button"
                      aria-label={`${timeSlot} - ${cellStatus.label}`}
                      style={{ 
                        height: `${slotHeight}px`, 
                        marginBottom: `${slotMargin}px` 
                      }}
                    >
                      <span className="sr-only">{cellStatus.label}</span>
                    </div>
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
