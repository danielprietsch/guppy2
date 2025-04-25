
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addWeeks, subWeeks, addDays, startOfWeek } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeeklyViewProps {
  selectedDate: Date;
  appointments: any[];
  onDateChange: (date: Date) => void;
}

const WeeklyView = ({ selectedDate, appointments, onDateChange }: WeeklyViewProps) => {
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
    } else {
      // This is simplified. In a real app, you'd check the professional's availability data
      // For now, we'll randomly assign free or closed status for demonstration
      const randomStatus = Math.random() > 0.2 ? 'free' : 'closed';
      return randomStatus === 'free' 
        ? { status: 'free', color: 'bg-green-100', label: 'Livre' } 
        : { status: 'closed', color: 'bg-amber-100', label: 'Fechado' };
    }
  };

  return (
    <Card className="h-full w-full">
      <CardContent className="p-2 sm:p-4 h-full">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 py-2">
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
        <div className="grid grid-cols-8 gap-1 sm:gap-2 w-full overflow-x-auto h-[calc(100%-3rem)]">
          <div className="space-y-1 sm:space-y-2">
            <div className="h-10 sm:h-12"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-10 sm:h-12 text-xs sm:text-sm text-muted-foreground flex items-center justify-end pr-2"
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {weekDays.map((date) => (
            <div key={date.toString()} className="space-y-1 sm:space-y-2 min-w-[100px]">
              <div className="text-center h-10 sm:h-12">
                <div className="font-semibold text-xs sm:text-sm">
                  {format(date, 'EEEE', { locale: ptBR })}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {format(date, 'd MMM', { locale: ptBR })}
                </div>
              </div>
              {hours.map((hour) => {
                const cellStatus = getCellStatus(date, hour);
                const cellAppointments = appointments.filter(app => {
                  const appDate = new Date(app.date);
                  const appHour = parseInt(app.time.split(':')[0]);
                  return format(appDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && appHour === hour;
                });

                return (
                  <div
                    key={hour}
                    className={`h-10 sm:h-12 border rounded-md ${cellStatus.color} relative`}
                  >
                    <div className="absolute top-0 right-0 text-[10px] sm:text-xs font-medium px-1 py-0.5 rounded-bl bg-white/80">
                      {cellStatus.label}
                    </div>
                    {cellAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="p-0.5 sm:p-1 m-0.5 bg-primary/10 rounded-sm text-[10px] sm:text-xs truncate"
                      >
                        {app.client.name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyView;
