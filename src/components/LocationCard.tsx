import { useState } from "react";
import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { DailyAvailabilityCell } from "./location/DailyAvailabilityCell";

const beautySalonImages = [
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=800&q=80",
];

function formatAddressForMaps(address: string, city: string, state: string) {
  const full = `${address}, ${city}, ${state}`;
  return encodeURIComponent(full);
}

type ShiftAvailabilityMap = {
  [date: string]: {
    morning: {
      totalCabins: number;
      availableCabins: number;
      manuallyClosedCount: number;
    };
    afternoon: {
      totalCabins: number;
      availableCabins: number;
      manuallyClosedCount: number;
    };
    evening: {
      totalCabins: number;
      availableCabins: number;
      manuallyClosedCount: number;
    };
  };
};

interface LocationCardProps {
  location: Location;
}

const LocationCard = ({ location }: LocationCardProps) => {
  const [showAvailability, setShowAvailability] = useState(true);
  const [availabilityData, setAvailabilityData] = useState<ShiftAvailabilityMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return new Date(today.setDate(today.getDate() - daysToSubtract));
  });

  const displayImage = location.imageUrl || (() => {
    const imageIndex = parseInt(location.id.replace(/\D/g, ""), 10) % beautySalonImages.length;
    return beautySalonImages[imageIndex];
  })();

  const googleMapsEmbedUrl = `https://www.google.com/maps?&q=${formatAddressForMaps(location.address, location.city, location.state)}&z=18&output=embed`;

  useEffect(() => {
    const fetchAvailabilityData = async () => {
      setIsLoading(true);
      const startDate = currentDate;
      const availabilityMap: ShiftAvailabilityMap = {};

      try {
        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('id, availability')
          .eq('location_id', location.id);

        if (cabinsError) {
          console.error("Error fetching cabins:", cabinsError);
          return;
        }

        for (let i = 0; i < 7; i++) {
          const date = addDays(startDate, i);
          const dateStr = format(date, "yyyy-MM-dd");

          const totalCabins = location.cabinsCount;
          let availableMorning = 0;
          let availableAfternoon = 0;
          let availableEvening = 0;
          let closedMorning = 0;
          let closedAfternoon = 0;
          let closedEvening = 0;

          cabins?.forEach(cabin => {
            const availability = cabin.availability as any;
            if (availability?.morning) availableMorning++;
            else closedMorning++;
            if (availability?.afternoon) availableAfternoon++;
            else closedAfternoon++;
            if (availability?.evening) availableEvening++;
            else closedEvening++;
          });

          availabilityMap[dateStr] = {
            morning: {
              totalCabins,
              availableCabins: availableMorning,
              manuallyClosedCount: closedMorning
            },
            afternoon: {
              totalCabins,
              availableCabins: availableAfternoon,
              manuallyClosedCount: closedAfternoon
            },
            evening: {
              totalCabins,
              availableCabins: availableEvening,
              manuallyClosedCount: closedEvening
            }
          };
        }
        
        setAvailabilityData(availabilityMap);
      } catch (error) {
        console.error("Error generating availability data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityData();
  }, [location.id, location.cabinsCount, currentDate]);

  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(currentDate, i));

  return (
    <div className="relative">
      <Link to={`/locations/${location.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{location.name}</h3>
              <button 
                className="flex items-center text-primary text-sm hover:underline"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Ver disponibilidade
              </button>
            </div>
            <p className="text-sm text-muted-foreground">{location.address}, {location.city}</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {location.cabinsCount} cabines
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {location.openingHours.open} - {location.openingHours.close}
              </span>
            </div>
            
            {showAvailability && (
              <div className="mt-4 p-2 bg-secondary/20 rounded-md">
                <h4 className="text-sm font-medium mb-2">Disponibilidade próximos dias</h4>
                {isLoading ? (
                  <div className="flex justify-center p-2">
                    <p className="text-xs">Carregando...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-8 gap-1">
                    <div className="text-xs space-y-4 pt-6">
                      <div>Manhã</div>
                      <div>Tarde</div>
                      <div>Noite</div>
                    </div>
                    {nextDays.map((date, i) => {
                      const dateStr = format(date, "yyyy-MM-dd");
                      return (
                        <DailyAvailabilityCell
                          key={i}
                          date={date}
                          shifts={availabilityData[dateStr] || {
                            morning: { totalCabins: 0, availableCabins: 0, manuallyClosedCount: 0 },
                            afternoon: { totalCabins: 0, availableCabins: 0, manuallyClosedCount: 0 },
                            evening: { totalCabins: 0, availableCabins: 0, manuallyClosedCount: 0 }
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <div className="grid grid-cols-2 gap-2 p-2">
            <div className="aspect-square max-h-32 overflow-hidden rounded-lg">
              <img
                src={displayImage}
                alt={location.name}
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
            
            <div className="aspect-square max-h-32 rounded-lg overflow-hidden">
              <iframe
                title={`${location.name} Mapa`}
                src={googleMapsEmbedUrl}
                width="100%"
                height="100%"
                className="w-full h-full"
                style={{
                  border: "none",
                  borderRadius: "0.5rem"
                }}
                allowFullScreen
              />
            </div>
          </div>

          <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
            {location.amenities.map((amenity, index) => (
              <span
                key={index}
                className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full"
              >
                {amenity}
              </span>
            ))}
          </CardFooter>
        </Card>
      </Link>
    </div>
  );
};

export default LocationCard;
