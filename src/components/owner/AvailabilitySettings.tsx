
import { useState, useCallback, useEffect } from "react";
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
import { debugAreaLog } from "@/utils/debugLogger";

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
  const [bookedDates, setBookedDates] = useState<{ [date: string]: { [turn: string]: boolean } }>({});
  
  // Selecionar primeira cabine automaticamente ao carregar
  useEffect(() => {
    if (locationCabins.length > 0 && !selectedCabin) {
      setSelectedCabin(locationCabins[0].id);
    }
  }, [locationCabins, selectedCabin]);
  
  // Inicializar dados da cabine selecionada
  useEffect(() => {
    if (selectedCabin) {
      const selectedCabinData = locationCabins.find(c => c.id === selectedCabin);
      if (selectedCabinData) {
        const initialPrices: { [date: string]: { [turn: string]: number } } = {};
        const initialClosedDates: { [date: string]: { [turn: string]: boolean } } = {};
        const initialBookedDates: { [date: string]: { [turn: string]: boolean } } = {};
        
        setSlotPrices(initialPrices);
        setManuallyClosedDates(initialClosedDates);
        setBookedDates(initialBookedDates);
      }
    }
  }, [selectedCabin, locationCabins]);

  const handleStatusChange = useCallback((date: string, turn: string, isManualClose: boolean) => {
    debugAreaLog('AVAILABILITY', `Status change for ${date} ${turn} to ${isManualClose ? 'closed' : 'open'}`);
    
    setManuallyClosedDates(prevState => {
      const newState = { ...prevState };
      
      if (!newState[date]) {
        newState[date] = {};
      }
      
      newState[date][turn] = isManualClose;
      
      return newState;
    });
  }, []);

  const handlePriceChange = useCallback((date: string, turn: string, price: string) => {
    debugAreaLog('PRICE_EDIT', `Price change for ${date} ${turn} to ${price}`);
    
    setSlotPrices(prevState => {
      const newState = { ...prevState };
      
      if (!newState[date]) {
        newState[date] = {};
      }
      
      // Convertendo a string para número antes de armazenar
      newState[date][turn] = parseFloat(price);
      
      return newState;
    });
  }, []);

  const getCabinPrice = (cabinId: string): number => {
    const cabin = locationCabins.find(c => c.id === cabinId);
    
    if (!cabin || !cabin.pricing?.defaultPricing) {
      return 100; // Valor padrão
    }
    
    return cabin.pricing.defaultPricing[1]?.morning || 100;
  };

  const getSelectedCabinCreationDate = (): string | undefined => {
    if (!selectedCabin) return undefined;
    
    const cabin = locationCabins.find(c => c.id === selectedCabin);
    return cabin?.created_at;
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
                        daysBooked={bookedDates}
                        onSelectDates={() => {}}
                        selectedDates={[]}
                        pricePerDay={getCabinPrice(selectedCabin)}
                        onStatusChange={handleStatusChange}
                        onPriceChange={handlePriceChange}
                        manuallyClosedDates={manuallyClosedDates}
                        slotPrices={slotPrices}
                        cabinCreatedAt={getSelectedCabinCreationDate()}
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
