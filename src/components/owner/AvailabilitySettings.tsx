
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Location, Cabin } from "@/lib/types";
import CabinAvailabilityCalendar from "@/components/CabinAvailabilityCalendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AvailabilitySettingsProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const AvailabilitySettings = ({ 
  selectedLocation, 
  locationCabins 
}: AvailabilitySettingsProps) => {
  const [selectedDates, setSelectedDates] = useState<{ [cabinId: string]: string[] }>({});
  const [daysBooked, setDaysBooked] = useState<{ [cabinId: string]: { [date: string]: { [turn: string]: boolean } } }>({});
  const [manuallyClosedDates, setManuallyClosedDates] = useState<{ [cabinId: string]: { [date: string]: { [turn: string]: boolean } } }>({});

  const handleStatusChange = (cabinId: string, date: string, turn: string, isManualClose: boolean) => {
    setManuallyClosedDates(prev => {
      const updated = { ...prev };
      if (!updated[cabinId]) {
        updated[cabinId] = {};
      }
      if (!updated[cabinId][date]) {
        updated[cabinId][date] = {
          morning: false,
          afternoon: false,
          evening: false
        };
      }
      updated[cabinId][date][turn] = isManualClose;
      return updated;
    });

    toast({
      title: isManualClose ? "Turno fechado manualmente" : "Turno reaberto",
      description: `${format(new Date(date), "dd/MM/yyyy", { locale: ptBR })} - ${
        turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"
      }`,
    });
  };

  const handlePriceUpdate = (cabinId: string, date: string, turn: string, price: number) => {
    toast({
      title: "Preço atualizado",
      description: `O preço para ${format(new Date(date), "dd/MM/yyyy", { locale: ptBR })} (${
        turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"
      }) foi atualizado para R$ ${price}.`,
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Disponibilidade - {selectedLocation?.name}</CardTitle>
          <CardDescription>
            Configure a disponibilidade das cabines por períodos e dias
          </CardDescription>
        </CardHeader>
      </Card>

      {locationCabins.map((cabin) => (
        <Card key={cabin.id} className="w-full">
          <CardHeader>
            <CardTitle>{cabin.name}</CardTitle>
            <CardDescription>
              Gerencie a disponibilidade e preços desta cabine
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <CabinAvailabilityCalendar
                selectedTurn="morning"
                daysBooked={daysBooked[cabin.id] || {}}
                onSelectDates={(dates) => setSelectedDates({ ...selectedDates, [cabin.id]: dates })}
                selectedDates={selectedDates[cabin.id] || []}
                pricePerDay={cabin.price || 100}
                onPriceChange={(date, turn, price) => handlePriceUpdate(cabin.id, date, turn, price)}
                onStatusChange={(date, turn, isManualClose) => handleStatusChange(cabin.id, date, turn, isManualClose)}
                manuallyClosedDates={manuallyClosedDates[cabin.id] || {}}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
