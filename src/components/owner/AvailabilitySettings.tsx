
import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Location, Cabin } from "@/lib/types";
import CabinAvailabilityCalendar from "@/components/CabinAvailabilityCalendar";
import { toast } from "@/hooks/use-toast";

interface AvailabilitySettingsProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const AvailabilitySettings = ({ 
  selectedLocation, 
  locationCabins 
}: AvailabilitySettingsProps) => {
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [manuallyClosedDates, setManuallyClosedDates] = useState<{ [date: string]: { [turn: string]: boolean } }>({});
  const [slotPrices, setSlotPrices] = useState<{ [date: string]: { [turn: string]: number } }>({});

  const handleStatusChange = useCallback((date: string, turn: string, isManualClose: boolean) => {
    setManuallyClosedDates(prevState => {
      const newState = { ...prevState };
      
      if (!newState[date]) {
        newState[date] = {};
      }
      
      newState[date][turn] = isManualClose;
      
      toast({
        title: isManualClose ? "Turno fechado" : "Turno liberado",
        description: `${isManualClose ? "Fechado" : "Liberado"} o turno para a data ${date}`,
      });
      
      return newState;
    });
  }, []);

  const handlePriceChange = useCallback((date: string, turn: string, price: number) => {
    setSlotPrices(prevState => {
      const newState = { ...prevState };
      
      if (!newState[date]) {
        newState[date] = {};
      }
      
      newState[date][turn] = price;
      
      toast({
        title: "Preço atualizado",
        description: `Preço do turno atualizado para R$ ${price.toFixed(2)}`,
      });
      
      return newState;
    });
  }, []);

  const getCabinPrice = (cabinId: string): number => {
    const cabin = locationCabins.find(c => c.id === cabinId);
    
    if (!cabin || !cabin.pricing?.defaultPricing) {
      return 100; // Valor padrão
    }
    
    // Pega o preço padrão da segunda-feira (índice 1) para o turno da manhã
    return cabin.pricing.defaultPricing[1]?.morning || 100;
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
        <CardContent>
          {locationCabins.length > 0 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {locationCabins.map((cabin) => (
                  <button
                    key={cabin.id}
                    onClick={() => setSelectedCabin(cabin.id)}
                    className={`p-2 rounded text-sm ${
                      selectedCabin === cabin.id
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {cabin.name}
                  </button>
                ))}
              </div>

              {selectedCabin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Calendário</CardTitle>
                    <CardDescription>Visualize e configure a disponibilidade por dia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <CabinAvailabilityCalendar
                        selectedTurn="morning"
                        daysBooked={{}}
                        onSelectDates={() => {}}
                        selectedDates={[]}
                        pricePerDay={getCabinPrice(selectedCabin)}
                        onStatusChange={handleStatusChange}
                        onPriceChange={handlePriceChange}
                        manuallyClosedDates={manuallyClosedDates}
                        slotPrices={slotPrices}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
