
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addWeeks, subWeeks, addDays, startOfWeek } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WorkingHours, BreakTime, isHourWithinWorkingHours } from "@/hooks/useWorkingHours";

interface WeeklyViewProps {
  selectedDate: Date;
  appointments: any[];
  onDateChange: (date: Date) => void;
  workingHours: WorkingHours;
  breakTime: BreakTime;
}

const WeeklyView = ({ 
  selectedDate, 
  appointments, 
  onDateChange,
  workingHours,
  breakTime
}: WeeklyViewProps) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handlePreviousWeek = () => {
    onDateChange(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    onDateChange(addWeeks(selectedDate, 1));
  };

  const getCellStatus = (date: Date, hour: number) => {
    const cellAppointments = appointments.filter(app => {
      const appDate = new Date(app.date);
      const appHour = parseInt(app.time.split(':')[0]);
      return format(appDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && appHour === hour;
    });

    if (cellAppointments.length > 0) {
      return { status: 'scheduled', color: 'bg-red-100', label: 'Agendado' };
    } else if (isHourWithinWorkingHours(hour, date, workingHours, breakTime)) {
      return { status: 'free', color: 'bg-green-100', label: 'Livre' };
    } else {
      return { status: 'closed', color: 'bg-amber-100', label: 'Fechado' };
    }
  };

  // Format day name as a short version to prevent wrapping
  const formatDayName = (date: Date) => {
    const fullName = format(date, 'EEEE', { locale: ptBR });
    // Use abbreviated day names or first 3 letters
    return format(date, 'EEE', { locale: ptBR });
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
              {hours.map((hour) => (
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
                <Card className="text-center p-2 bg-background">
                  <div className="font-semibold capitalize">
                    {formatDayName(date)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(date, 'd MMM', { locale: ptBR })}
                  </div>
                </Card>
                {hours.map((hour) => {
                  const cellStatus = getCellStatus(date, hour);
                  const cellAppointments = appointments.filter(app => {
                    const appDate = new Date(app.date);
                    const appHour = parseInt(app.time.split(':')[0]);
                    return format(appDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && appHour === hour;
                  });

                  return (
                    <Card
                      key={hour}
                      className={`h-12 ${cellStatus.color} relative`}
                    >
                      <CardContent className="p-1 h-full">
                        <div className="absolute top-0 right-0 text-[10px] font-medium px-1.5 py-0.5 rounded-bl bg-white/90">
                          {cellStatus.label}
                        </div>
                        {cellAppointments.map((app) => (
                          <div
                            key={app.id}
                            className="text-[10px] p-1 bg-primary/10 rounded-sm truncate mt-1"
                          >
                            {app.client.name}
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
