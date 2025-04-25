
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
    <div className="h-full flex flex-col">
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
            
            return (
              <Card key={hour} className="border shadow-sm">
                <CardContent className="p-3">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2 text-sm font-medium text-muted-foreground flex items-center">
                      {`${hour.toString().padStart(2, '0')}:00`}
                    </div>
                    <div className={`col-span-10 min-h-[3rem] rounded-md ${hourStatus.color} relative p-2`}>
                      <div className="absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full bg-white/90">
                        {hourStatus.label}
                      </div>
                      {appointments
                        .filter(app => parseInt(app.time.split(':')[0]) === hour)
                        .map((app) => (
                          <div
                            key={app.id}
                            className="mt-2 p-2 bg-primary/10 rounded-md text-sm"
                          >
                            {app.client.name} - {app.time}
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
