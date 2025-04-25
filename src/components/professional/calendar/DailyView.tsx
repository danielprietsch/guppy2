
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface DailyViewProps {
  selectedDate: Date;
  appointments: any[];
}

const DailyView = ({ selectedDate, appointments }: DailyViewProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="text-lg font-semibold mb-4">
          {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
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
