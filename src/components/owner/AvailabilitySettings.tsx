import { useState, useEffect } from "react";
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
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import { BatchPriceEditor } from "@/components/owner/pricing/BatchPriceEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CabinPricing {
  defaultPricing: {
    price?: number;
  };
  specificDates: {
    [date: string]: {
      [turn: string]: {
        price: number;
        available?: boolean;
      };
    };
  };
}

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
  const [cabinPrices, setCabinPrices] = useState<{ [cabinId: string]: number }>(() => {
    const prices: { [cabinId: string]: number } = {};
    locationCabins.forEach(cabin => {
      prices[cabin.id] = cabin.price || 100;
    });
    return prices;
  });
  const [slotPrices, setSlotPrices] = useState<{ [cabinId: string]: { [date: string]: { [turn: string]: number } } }>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("calendar");

  useEffect(() => {
    if (selectedLocation) {
      loadBookingData();
      loadCabinPrices();
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (locationCabins.length > 0 && !selectedCabin) {
      setSelectedCabin(locationCabins[0].id);
    }
  }, [locationCabins, selectedCabin]);

  const loadBookingData = async () => {
    try {
      console.log("Loading booking data for location:", selectedLocation?.id);
      
      if (selectedLocation) {
        const { data: cabins } = await supabase
          .from('cabins')
          .select('id')
          .eq('location_id', selectedLocation.id);
        
        if (cabins && cabins.length > 0) {
          const cabinIds = cabins.map(cabin => cabin.id);
          
          const { data: bookings } = await supabase
            .from('bookings')
            .select('*')
            .in('cabin_id', cabinIds);
          
          if (bookings) {
            const bookedDays: { [cabinId: string]: { [date: string]: { [turn: string]: boolean } } } = {};
            
            bookings.forEach(booking => {
              if (!bookedDays[booking.cabin_id]) {
                bookedDays[booking.cabin_id] = {};
              }
              if (!bookedDays[booking.cabin_id][booking.date]) {
                bookedDays[booking.cabin_id][booking.date] = {
                  morning: false,
                  afternoon: false,
                  evening: false
                };
              }
              bookedDays[booking.cabin_id][booking.date][booking.shift] = true;
            });
            
            setDaysBooked(bookedDays);
          }
        }
      }
    } catch (error) {
      console.error("Error loading booking data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de reservas.",
        variant: "destructive"
      });
    }
  };

  const parsePricingData = (pricingJson: Json | null): CabinPricing => {
    const defaultPricing: CabinPricing = {
      defaultPricing: { price: 100 },
      specificDates: {}
    };

    if (!pricingJson) return defaultPricing;

    try {
      if (
        typeof pricingJson === 'object' && 
        pricingJson !== null && 
        !Array.isArray(pricingJson)
      ) {
        const pricingObj = pricingJson as Record<string, any>;
        
        if (pricingObj.defaultPricing && pricingObj.specificDates) {
          return {
            defaultPricing: pricingObj.defaultPricing,
            specificDates: pricingObj.specificDates
          };
        }
      }
      
      return defaultPricing;
    } catch (e) {
      console.error("Error parsing pricing data:", e);
      return defaultPricing;
    }
  };

  const loadCabinPrices = async () => {
    try {
      if (!selectedLocation) return;

      const { data: cabinsData, error } = await supabase
        .from('cabins')
        .select('id, pricing')
        .eq('location_id', selectedLocation.id);

      if (error) throw error;

      if (cabinsData) {
        const prices: { [cabinId: string]: number } = {};
        const slotPricingData: { [cabinId: string]: { [date: string]: { [turn: string]: number } } } = {};
        const manuallyClosedData: { [cabinId: string]: { [date: string]: { [turn: string]: boolean } } } = {};

        cabinsData.forEach(cabin => {
          const pricingData = parsePricingData(cabin.pricing);
          
          const defaultPrice = pricingData?.defaultPricing?.price || 100;
          prices[cabin.id] = defaultPrice;
          
          if (pricingData && pricingData.specificDates) {
            slotPricingData[cabin.id] = {};
            manuallyClosedData[cabin.id] = {};
            
            Object.entries(pricingData.specificDates).forEach(([date, dateData]) => {
              slotPricingData[cabin.id][date] = {};
              if (!manuallyClosedData[cabin.id][date]) {
                manuallyClosedData[cabin.id][date] = {
                  morning: false,
                  afternoon: false,
                  evening: false
                };
              }
              
              Object.entries(dateData).forEach(([turn, turnData]) => {
                slotPricingData[cabin.id][date][turn] = turnData.price || defaultPrice;
                
                if (turnData.available === false) {
                  manuallyClosedData[cabin.id][date][turn] = true;
                }
              });
            });
          }
        });

        setCabinPrices(prices);
        setSlotPrices(slotPricingData);
        setManuallyClosedDates(manuallyClosedData);
      }
    } catch (error) {
      console.error("Error loading cabin prices:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os preços das cabines.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (cabinId: string, date: string, turn: string, isManualClose: boolean) => {
    const selectedDate = new Date(date);
    const today = startOfDay(new Date());
    
    if (isBefore(selectedDate, today)) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível alterar a disponibilidade de datas passadas.",
        variant: "destructive"
      });
      return;
    }
    
    try {
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

      setIsUpdating(true);

      const { data: cabinData, error: fetchError } = await supabase
        .from('cabins')
        .select('pricing')
        .eq('id', cabinId)
        .single();

      if (fetchError) throw fetchError;

      if (cabinData) {
        const pricingData = parsePricingData(cabinData.pricing);
        
        if (!pricingData.specificDates) {
          pricingData.specificDates = {};
        }
        
        if (!pricingData.specificDates[date]) {
          pricingData.specificDates[date] = {};
        }
        
        if (!pricingData.specificDates[date][turn]) {
          pricingData.specificDates[date][turn] = {
            price: slotPrices[cabinId]?.[date]?.[turn] || cabinPrices[cabinId] || 100,
            available: !isManualClose
          };
        } else {
          pricingData.specificDates[date][turn].available = !isManualClose;
        }
        
        const pricingJson = {
          defaultPricing: pricingData.defaultPricing,
          specificDates: pricingData.specificDates
        };

        const { error: updateError } = await supabase
          .from('cabins')
          .update({ pricing: pricingJson as Json })
          .eq('id', cabinId);
          
        if (updateError) throw updateError;
      }

      toast({
        title: isManualClose ? "Turno fechado manualmente" : "Turno reaberto",
        description: `${format(new Date(date), "dd/MM/yyyy", { locale: ptBR })} - ${
          turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"
        }`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      
      setManuallyClosedDates(prev => {
        const updated = { ...prev };
        if (updated[cabinId] && updated[cabinId][date]) {
          updated[cabinId][date][turn] = !isManualClose;
        }
        return updated;
      });
      
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do turno.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriceUpdate = async (cabinId: string, date: string, turn: string, price: number) => {
    const selectedDate = new Date(date);
    const today = startOfDay(new Date());
    
    if (isBefore(selectedDate, today)) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível alterar preços de datas passadas.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSlotPrices(prev => {
        const updated = { ...prev };
        if (!updated[cabinId]) {
          updated[cabinId] = {};
        }
        if (!updated[cabinId][date]) {
          updated[cabinId][date] = {
            morning: cabinPrices[cabinId] || 100,
            afternoon: cabinPrices[cabinId] || 100,
            evening: cabinPrices[cabinId] || 100
          };
        }
        updated[cabinId][date][turn] = price;
        return updated;
      });
      
      setIsUpdating(true);
      
      const { data: cabinData, error: fetchError } = await supabase
        .from('cabins')
        .select('pricing')
        .eq('id', cabinId)
        .single();

      if (fetchError) throw fetchError;

      if (cabinData) {
        const pricingData = parsePricingData(cabinData.pricing);
        
        if (!pricingData.specificDates) {
          pricingData.specificDates = {};
        }
        
        if (!pricingData.specificDates[date]) {
          pricingData.specificDates[date] = {};
        }
        
        if (!pricingData.specificDates[date][turn]) {
          pricingData.specificDates[date][turn] = {
            price: price,
            available: !manuallyClosedDates[cabinId]?.[date]?.[turn]
          };
        } else {
          pricingData.specificDates[date][turn].price = price;
        }
        
        const pricingJson = {
          defaultPricing: pricingData.defaultPricing,
          specificDates: pricingData.specificDates
        };
        
        const { error: updateError } = await supabase
          .from('cabins')
          .update({ pricing: pricingJson as Json })
          .eq('id', cabinId);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Preço atualizado",
        description: `O preço para ${format(new Date(date), "dd/MM/yyyy", { locale: ptBR })} (${
          turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"
        }) foi atualizado para R$ ${price}.`,
      });
    } catch (error) {
      console.error("Error updating price:", error);
      
      const originalPrice = cabinPrices[cabinId] || 100;
      setSlotPrices(prev => {
        const updated = { ...prev };
        if (updated[cabinId] && updated[cabinId][date]) {
          updated[cabinId][date][turn] = originalPrice;
        }
        return updated;
      });
      
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBatchPriceUpdate = async (cabinId: string, dates: string[], turns: string[], price: number) => {
    const today = startOfDay(new Date());
    const futureDates = dates.filter(date => !isBefore(new Date(date), today));
    
    if (futureDates.length < dates.length) {
      const pastDatesCount = dates.length - futureDates.length;
      toast({
        title: "Aviso",
        description: `${pastDatesCount} data(s) passada(s) foram ignoradas.`,
      });
      
      if (futureDates.length === 0) {
        toast({
          title: "Operação cancelada",
          description: "Todas as datas selecionadas são passadas.",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      setIsUpdating(true);
      
      const { data: cabinData, error: fetchError } = await supabase
        .from('cabins')
        .select('pricing')
        .eq('id', cabinId)
        .single();

      if (fetchError) throw fetchError;

      if (cabinData) {
        const pricingData = parsePricingData(cabinData.pricing);
        
        futureDates.forEach(date => {
          if (!pricingData.specificDates) {
            pricingData.specificDates = {};
          }
          
          if (!pricingData.specificDates[date]) {
            pricingData.specificDates[date] = {};
          }
          
          turns.forEach(turn => {
            if (!pricingData.specificDates[date][turn]) {
              pricingData.specificDates[date][turn] = {
                price: price,
                available: !manuallyClosedDates[cabinId]?.[date]?.[turn]
              };
            } else {
              pricingData.specificDates[date][turn].price = price;
            }
            
            setSlotPrices(prev => {
              const updated = { ...prev };
              if (!updated[cabinId]) {
                updated[cabinId] = {};
              }
              if (!updated[cabinId][date]) {
                updated[cabinId][date] = {
                  morning: cabinPrices[cabinId] || 100,
                  afternoon: cabinPrices[cabinId] || 100,
                  evening: cabinPrices[cabinId] || 100
                };
              }
              updated[cabinId][date][turn] = price;
              return updated;
            });
          });
        });
        
        const pricingJson = {
          defaultPricing: pricingData.defaultPricing,
          specificDates: pricingData.specificDates
        };
        
        const { error: updateError } = await supabase
          .from('cabins')
          .update({ pricing: pricingJson as Json })
          .eq('id', cabinId);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: "Preços atualizados em massa",
        description: `Os preços foram atualizados para ${futureDates.length} dia(s).`,
      });
    } catch (error) {
      console.error("Error updating batch prices:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os preços em massa.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
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
            <div className="space-y-4">
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="calendar">Calendário</TabsTrigger>
                    <TabsTrigger value="batch">Edição em Massa</TabsTrigger>
                  </TabsList>

                  <TabsContent value="calendar" className="mt-4">
                    <div className="w-full overflow-x-auto">
                      <CabinAvailabilityCalendar
                        selectedTurn="morning"
                        daysBooked={daysBooked[selectedCabin] || {}}
                        onSelectDates={(dates) => setSelectedDates({ ...selectedDates, [selectedCabin]: dates })}
                        selectedDates={selectedDates[selectedCabin] || []}
                        pricePerDay={cabinPrices[selectedCabin] || 100}
                        onPriceChange={(date, turn, price) => handlePriceUpdate(selectedCabin, date, turn, price)}
                        onStatusChange={(date, turn, isManualClose) => handleStatusChange(selectedCabin, date, turn, isManualClose)}
                        manuallyClosedDates={manuallyClosedDates[selectedCabin] || {}}
                        slotPrices={slotPrices[selectedCabin]}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="batch" className="mt-4">
                    <BatchPriceEditor 
                      defaultPrice={cabinPrices[selectedCabin] || 100}
                      onPriceChange={(dates, turns, price) => 
                        handleBatchPriceUpdate(selectedCabin, dates, turns, price)
                      }
                    />
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
