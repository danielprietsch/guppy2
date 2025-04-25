
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

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-12 py-2 border-b last:border-b-0"
            >
              <div className="col-span-2 text-sm text-muted-foreground">
                {`${hour.toString().padStart(2, '0')}:00`}
              </div>
              <div className="col-span-10 min-h-[40px] rounded-md bg-accent/10">
                {appointments
                  .filter(app => {
                    const appHour = parseInt(app.time.split(':')[0]);
                    return appHour === hour;
                  })
                  .map((app) => (
                    <div
                      key={app.id}
                      className="p-2 m-1 bg-primary/10 rounded-md text-sm"
                    >
                      {app.client.name} - {app.time}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyView;
