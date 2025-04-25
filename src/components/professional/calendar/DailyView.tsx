import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DailyViewProps {
  selectedDate: Date;
  appointments: any[];
  onDateChange: (date: Date) => void;
}

const DailyView = ({ selectedDate, appointments, onDateChange }: DailyViewProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const getHourStatus = (hour: number) => {
    const hourAppointments = appointments.filter(app => {
      const appHour = parseInt(app.time.split(':')[0]);
      return appHour === hour;
    });

    if (hourAppointments.length > 0) {
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
    <Card className="h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background sticky top-0 z-10">
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
          <div className="space-y-1 p-4">
            {hours.map((hour) => {
              const hourStatus = getHourStatus(hour);
              
              return (
                <div
                  key={hour}
                  className="grid grid-cols-12 py-1 sm:py-2 border-b last:border-b-0"
                >
                  <div className="col-span-2 text-xs sm:text-sm text-muted-foreground flex items-center">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </div>
                  <div className={`col-span-10 min-h-[2.5rem] sm:min-h-[3rem] rounded-md ${hourStatus.color} relative`}>
                    <div className="absolute top-1 right-2 text-xs font-medium px-1.5 py-0.5 rounded-full bg-white/80">
                      {hourStatus.label}
                    </div>
                    {appointments
                      .filter(app => parseInt(app.time.split(':')[0]) === hour)
                      .map((app) => (
                        <div
                          key={app.id}
                          className="p-1 sm:p-2 m-1 bg-primary/10 rounded-md text-xs sm:text-sm"
                        >
                          {app.client.name} - {app.time}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyView;
