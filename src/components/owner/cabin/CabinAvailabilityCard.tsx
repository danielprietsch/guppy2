
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { DailyAvailabilityCell } from "@/components/location/DailyAvailabilityCell";
import { format, addDays, startOfWeek, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from 'date-fns/locale';

interface CabinAvailabilityCardProps {
  cabinId: string;
  pricing: any;
  createdAt?: string;
}

export const CabinAvailabilityCard = ({ cabinId, pricing, createdAt }: CabinAvailabilityCardProps) => {
  // Use cabin creation date if available, otherwise use today
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  useEffect(() => {
    if (createdAt) {
      const cabinCreationDate = parseISO(createdAt);
      // Garantir que a data de início é pelo menos a data de criação
      if (isBefore(startDate, cabinCreationDate)) {
        setStartDate(cabinCreationDate);
      }
    }
  }, [createdAt, startDate]);
  
  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  // Filtra dias da semana para garantir que nenhuma data anterior à criação da cabine seja exibida
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    .filter(date => !createdAt || !isBefore(date, parseISO(createdAt)));
  const currentDay = startOfDay(new Date());

  const getShiftAvailability = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayPricing = pricing?.specificDates?.[dateStr] || {};
    const isPastDate = isBefore(date, currentDay);
    
    const defaultAvailability = {
      totalCabins: 1,
      availableCabins: isPastDate ? 0 : 1,
      manuallyClosedCount: 0,
    };

    return {
      morning: {
        ...defaultAvailability,
        price: dayPricing.morning?.price,
        availableCabins: isPastDate || dayPricing.morning?.available === false ? 0 : 1,
        manuallyClosedCount: dayPricing.morning?.available === false ? 1 : 0,
      },
      afternoon: {
        ...defaultAvailability,
        price: dayPricing.afternoon?.price,
        availableCabins: isPastDate || dayPricing.afternoon?.available === false ? 0 : 1,
        manuallyClosedCount: dayPricing.afternoon?.available === false ? 1 : 0,
      },
      evening: {
        ...defaultAvailability,
        price: dayPricing.evening?.price,
        availableCabins: isPastDate || dayPricing.evening?.available === false ? 0 : 1,
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
