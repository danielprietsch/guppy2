
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

// Define interface for pricing structure
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
  // Initialize state for each cabin
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

  // Load booking data from database
  useEffect(() => {
    if (selectedLocation) {
      loadBookingData();
      loadCabinPrices();
    }
  }, [selectedLocation]);

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

  // Helper function to safely parse pricing data from JSON
  const parsePricingData = (pricingJson: Json | null): CabinPricing => {
    // Default pricing structure if nothing is available
    const defaultPricing: CabinPricing = {
      defaultPricing: { price: 100 },
      specificDates: {}
    };

    if (!pricingJson) return defaultPricing;

    try {
      // Check if it's an object type of Json
      if (
        typeof pricingJson === 'object' && 
        pricingJson !== null && 
        !Array.isArray(pricingJson)
      ) {
        // Cast to Record<string, any> to access properties safely
        const pricingObj = pricingJson as Record<string, any>;
        
        // Verify if the expected structure exists
        if (pricingObj.defaultPricing && pricingObj.specificDates) {
          return {
            defaultPricing: pricingObj.defaultPricing,
            specificDates: pricingObj.specificDates
          };
        }
      }
      
      // If not valid structure, return default
      return defaultPricing;
    } catch (e) {
      console.error("Error parsing pricing data:", e);
      return defaultPricing;
    }
  };

  const loadCabinPrices = async () => {
    try {
      if (!selectedLocation) return;

      // Load cabin pricing data from the database
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
          // Parse the pricing data safely using our helper function
          const pricingData = parsePricingData(cabin.pricing);
          
          // Set default cabin price
          const defaultPrice = pricingData?.defaultPricing?.price || 100;
          prices[cabin.id] = defaultPrice;
          
          // Set slot-specific prices and availability if available
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
                // Set price
                slotPricingData[cabin.id][date][turn] = turnData.price || defaultPrice;
                
                // Set availability status (if false, it's manually closed)
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
    try {
      // Update local state immediately for better UX response
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

      // Update cabin availability in the database
      const { data: cabinData, error: fetchError } = await supabase
        .from('cabins')
        .select('pricing')
        .eq('id', cabinId)
        .single();

      if (fetchError) throw fetchError;

      if (cabinData) {
        // Parse the pricing data safely
        const pricingData = parsePricingData(cabinData.pricing);
        
        // Make sure structures exist
        if (!pricingData.specificDates) {
          pricingData.specificDates = {};
        }
        
        // Initialize the date entry if it doesn't exist
        if (!pricingData.specificDates[date]) {
          pricingData.specificDates[date] = {};
        }
        
        // Initialize the turn entry if it doesn't exist
        if (!pricingData.specificDates[date][turn]) {
          pricingData.specificDates[date][turn] = {
            price: slotPrices[cabinId]?.[date]?.[turn] || cabinPrices[cabinId] || 100,
            available: !isManualClose
          };
        } else {
          // Update the availability
          pricingData.specificDates[date][turn].available = !isManualClose;
        }
        
        // Convert CabinPricing back to Json for database update
        const pricingJson = {
          defaultPricing: pricingData.defaultPricing,
          specificDates: pricingData.specificDates
        };

        // Update the database
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
      
      // Revert the optimistic update if error
      setManuallyClosedDates(prev => {
        const updated = { ...prev };
        if (updated[cabinId] && updated[cabinId][date]) {
          updated[cabinId][date][turn] = !isManualClose; // Revert
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
    try {
      // Update local state immediately for better UX response
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
      
      // Update the database
      const { data: cabinData, error: fetchError } = await supabase
        .from('cabins')
        .select('pricing')
        .eq('id', cabinId)
        .single();

      if (fetchError) throw fetchError;

      if (cabinData) {
        // Parse the pricing data safely
        const pricingData = parsePricingData(cabinData.pricing);
        
        // Make sure specificDates exists
        if (!pricingData.specificDates) {
          pricingData.specificDates = {};
        }
        
        // Initialize the date entry if it doesn't exist
        if (!pricingData.specificDates[date]) {
          pricingData.specificDates[date] = {};
        }
        
        // Initialize the turn entry if it doesn't exist
        if (!pricingData.specificDates[date][turn]) {
          pricingData.specificDates[date][turn] = {
            price: price,
            available: !manuallyClosedDates[cabinId]?.[date]?.[turn]
          };
        } else {
          // Update the price
          pricingData.specificDates[date][turn].price = price;
        }
        
        // Convert CabinPricing back to Json for database update
        const pricingJson = {
          defaultPricing: pricingData.defaultPricing,
          specificDates: pricingData.specificDates
        };
        
        // Update the database
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
      
      // Revert the optimistic update if error
      const originalPrice = cabinPrices[cabinId] || 100;
      setSlotPrices(prev => {
        const updated = { ...prev };
        if (updated[cabinId] && updated[cabinId][date]) {
          updated[cabinId][date][turn] = originalPrice; // Revert to default price
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

      <div className="space-y-8">
        {locationCabins.map((cabin) => (
          <Card key={cabin.id} className="w-full">
            <CardHeader>
              <CardTitle>Cabine: {cabin.name}</CardTitle>
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
                  pricePerDay={cabinPrices[cabin.id] || cabin.price || 100}
                  onPriceChange={(date, turn, price) => handlePriceUpdate(cabin.id, date, turn, price)}
                  onStatusChange={(date, turn, isManualClose) => handleStatusChange(cabin.id, date, turn, isManualClose)}
                  manuallyClosedDates={manuallyClosedDates[cabin.id] || {}}
                  slotPrices={slotPrices[cabin.id]}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
