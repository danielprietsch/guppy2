
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

  return (
    <Card className="mb-6 overflow-x-auto">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {format(weekStart, "MMMM yyyy", { locale: ptBR })}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-8 gap-2 min-w-[800px]">
          {/* Time column */}
          <div className="space-y-2">
            <div className="h-12"></div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-12 text-sm text-muted-foreground flex items-center justify-end pr-2"
              >
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((date) => (
            <div key={date.toString()} className="space-y-2">
              <div className="text-center h-12">
                <div className="font-semibold">
                  {format(date, 'EEEE', { locale: ptBR })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(date, 'd MMM', { locale: ptBR })}
                </div>
              </div>
              {hours.map((hour) => {
                const hourAppointments = appointments.filter(app => {
                  const appDate = new Date(app.date);
                  const appHour = parseInt(app.time.split(':')[0]);
                  return format(appDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && appHour === hour;
                });

                let bgColorClass = "bg-accent/10";
                if (hourAppointments.length > 0) {
                  bgColorClass = "bg-blue-50";
                }

                return (
                  <div
                    key={hour}
                    className={`h-12 border rounded-md ${bgColorClass}`}
                  >
                    {hourAppointments.map((app) => (
                      <div
                        key={app.id}
                        className="p-1 m-0.5 bg-primary/10 rounded-sm text-xs truncate"
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
