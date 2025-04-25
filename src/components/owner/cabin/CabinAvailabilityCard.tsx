
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DailyAvailabilityCell } from "@/components/location/DailyAvailabilityCell";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface CabinAvailabilityCardProps {
  cabinId: string;
  pricing: any;
}

export const CabinAvailabilityCard = ({ cabinId, pricing }: CabinAvailabilityCardProps) => {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getShiftAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayPricing = pricing?.specificDates?.[dateStr] || {};
    
    const defaultAvailability = {
      totalCabins: 1,
      availableCabins: 1,
      manuallyClosedCount: 0,
    };

    return {
      morning: {
        ...defaultAvailability,
        price: dayPricing.morning?.price,
        availableCabins: dayPricing.morning?.available === false ? 0 : 1,
        manuallyClosedCount: dayPricing.morning?.available === false ? 1 : 0,
      },
      afternoon: {
        ...defaultAvailability,
        price: dayPricing.afternoon?.price,
        availableCabins: dayPricing.afternoon?.available === false ? 0 : 1,
        manuallyClosedCount: dayPricing.afternoon?.available === false ? 1 : 0,
      },
      evening: {
        ...defaultAvailability,
        price: dayPricing.evening?.price,
        availableCabins: dayPricing.evening?.available === false ? 0 : 1,
        manuallyClosedCount: dayPricing.evening?.available === false ? 1 : 0,
      }
    };
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date) => (
          <Card key={date.toString()} className="p-2">
            <CardContent className="p-0">
              <DailyAvailabilityCell
                date={date}
                shifts={getShiftAvailability(date)}
                cabinId={cabinId}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
