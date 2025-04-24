
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Location, Cabin } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(locationCabins[0] || null);
  const [selectedTurn, setSelectedTurn] = useState<"morning" | "afternoon" | "evening">("morning");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [pricePerDay, setPricePerDay] = useState<number>(selectedCabin?.price || 100);
  
  const [daysBooked, setDaysBooked] = useState<{ [date: string]: { [turn: string]: boolean } }>({});

  const handleCabinChange = (cabinId: string) => {
    const cabin = locationCabins.find(c => c.id === cabinId);
    if (cabin) {
      setSelectedCabin(cabin);
      setPricePerDay(cabin.price || 100);
    }
  };

  const handleTurnChange = (turn: "morning" | "afternoon" | "evening") => {
    setSelectedTurn(turn);
    setSelectedDates([]);
  };

  const handleSaveAvailability = () => {
    if (!selectedCabin) return;
    
    const updatedBookings = { ...daysBooked };
    
    selectedDates.forEach(date => {
      if (!updatedBookings[date]) {
        updatedBookings[date] = {
          morning: false,
          afternoon: false,
          evening: false
        };
      }
      updatedBookings[date][selectedTurn] = true;
    });
    
    setDaysBooked(updatedBookings);
    setSelectedDates([]);
    
    toast({
      title: "Disponibilidade salva",
      description: `As datas selecionadas foram configuradas para o turno ${
        selectedTurn === "morning" ? "Manhã" : selectedTurn === "afternoon" ? "Tarde" : "Noite"
      }.`,
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPricePerDay(value);
    }
  };

  const handlePriceUpdate = (date: string, turn: string, price: number) => {
    setPricePerDay(price);
    toast({
      title: "Preço atualizado",
      description: `O preço para ${format(new Date(date), "dd/MM/yyyy", { locale: ptBR })} (${
        turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"
      }) foi atualizado para R$ ${price}.`,
    });
  };

  const calculateTotalPrice = () => {
    return selectedDates.length * pricePerDay;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuração de Disponibilidade - {selectedLocation?.name}</CardTitle>
        <CardDescription>
          Configure a disponibilidade das cabines por períodos e dias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
          <div className="w-full">
            <div className="mb-4">
              <label htmlFor="cabin-selector" className="block text-sm font-medium mb-2">
                Selecione uma cabine
              </label>
              <select 
                id="cabin-selector"
                className="w-full border rounded-md p-2"
                onChange={(e) => handleCabinChange(e.target.value)}
                value={selectedCabin?.id || ""}
              >
                {locationCabins.map((cabin) => (
                  <option key={cabin.id} value={cabin.id}>
                    {cabin.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <Tabs defaultValue="morning" onValueChange={(v) => handleTurnChange(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="morning">Manhã</TabsTrigger>
                  <TabsTrigger value="afternoon">Tarde</TabsTrigger>
                  <TabsTrigger value="evening">Noite</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {selectedCabin && (
              <div className="w-full overflow-x-auto">
                <CabinAvailabilityCalendar
                  selectedTurn={selectedTurn}
                  daysBooked={daysBooked}
                  onSelectDates={setSelectedDates}
                  selectedDates={selectedDates}
                  pricePerDay={pricePerDay}
                  onPriceChange={handlePriceUpdate}
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Resumo e Preço</h3>
            
            <div className="mb-4">
              <label htmlFor="price-input" className="block text-sm font-medium mb-2">
                Preço por turno (R$)
              </label>
              <input
                id="price-input"
                type="number"
                className="w-full border rounded-md p-2"
                value={pricePerDay}
                onChange={handlePriceChange}
                min="1"
                step="1"
              />
            </div>
            
            <div className="mb-6">
              <p className="font-medium">Cabine selecionada:</p>
              <p>{selectedCabin?.name}</p>
              
              <p className="font-medium mt-3">Turno selecionado:</p>
              <p>{selectedTurn === "morning" ? "Manhã" : selectedTurn === "afternoon" ? "Tarde" : "Noite"}</p>
              
              <p className="font-medium mt-3">Dias selecionados:</p>
              <p>{selectedDates.length} dia(s)</p>
              
              {selectedDates.length > 0 && (
                <>
                  <div className="border-t border-b py-3 my-3">
                    <div className="flex justify-between">
                      <span>Subtotal ({selectedDates.length} dias):</span>
                      <span>R$ {calculateTotalPrice().toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    * Os valores são calculados por turno selecionado
                  </p>
                </>
              )}
            </div>
            
            <Button 
              onClick={handleSaveAvailability} 
              className="w-full"
              disabled={selectedDates.length === 0}
            >
              Salvar configuração
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
