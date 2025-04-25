import { useState } from "react";
import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Check, X } from "lucide-react";
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

type AvailabilityMap = {
  [date: string]: {
    totalCabins: number;
    availableCabins: number;
    manuallyClosedCount: number;
  };
};

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
  const [currentDate] = useState(new Date());

  const displayImage = location.imageUrl || (() => {
    const imageIndex = parseInt(location.id.replace(/\D/g, ""), 10) % beautySalonImages.length;
    return beautySalonImages[imageIndex];
  })();

  const googleMapsEmbedUrl = `https://www.google.com/maps?&q=${formatAddressForMaps(location.address, location.city, location.state)}&z=18&output=embed`;

  useEffect(() => {
    const fetchAvailabilityData = async () => {
      setIsLoading(true);
      const startDate = new Date();
      const availabilityMap: ShiftAvailabilityMap = {};

      // Generate next 7 days
      for (let i = 0; i < 7; i++) {
        const date = addDays(startDate, i);
        const dateStr = format(date, "yyyy-MM-dd");
        availabilityMap[dateStr] = {
          morning: { totalCabins: location.cabinsCount, availableCabins: 0, manuallyClosedCount: 0 },
          afternoon: { totalCabins: location.cabinsCount, availableCabins: 0, manuallyClosedCount: 0 },
          evening: { totalCabins: location.cabinsCount, availableCabins: 0, manuallyClosedCount: 0 }
        };
      }

      try {
        // Get all cabins for this location
        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('id, availability')
          .eq('location_id', location.id);

        if (cabinsError) throw cabinsError;
        
        if (cabins && cabins.length > 0) {
          const cabinIds = cabins.map(cabin => cabin.id);
          
          // For each date, check bookings and manual closures
          for (let i = 0; i < 7; i++) {
            const date = addDays(startDate, i);
            const dateStr = format(date, "yyyy-MM-dd");
            
            // Count manually closed cabins per shift
            const manuallyClosedCounts = {
              morning: 0,
              afternoon: 0,
              evening: 0
            };

            cabins.forEach(cabin => {
              const availability = cabin.availability as any;
              if (availability) {
                if (!availability.morning) manuallyClosedCounts.morning++;
                if (!availability.afternoon) manuallyClosedCounts.afternoon++;
                if (!availability.evening) manuallyClosedCounts.evening++;
              }
            });
            
            // Get bookings for this date
            const { data: bookings, error: bookingsError } = await supabase
              .from('bookings')
              .select('cabin_id, shift')
              .in('cabin_id', cabinIds)
              .eq('date', dateStr)
              .eq('status', 'confirmed');
              
            if (bookingsError) throw bookingsError;
            
            // Count bookings per shift
            const bookedCounts = {
              morning: new Set(),
              afternoon: new Set(),
              evening: new Set()
            };

            bookings?.forEach(booking => {
              if (booking.shift === 'morning') bookedCounts.morning.add(booking.cabin_id);
              if (booking.shift === 'afternoon') bookedCounts.afternoon.add(booking.cabin_id);
              if (booking.shift === 'evening') bookedCounts.evening.add(booking.cabin_id);
            });
            
            // Calculate available cabins per shift
            availabilityMap[dateStr] = {
              morning: {
                totalCabins: cabinIds.length,
                availableCabins: Math.max(0, cabinIds.length - bookedCounts.morning.size - manuallyClosedCounts.morning),
                manuallyClosedCount: manuallyClosedCounts.morning
              },
              afternoon: {
                totalCabins: cabinIds.length,
                availableCabins: Math.max(0, cabinIds.length - bookedCounts.afternoon.size - manuallyClosedCounts.afternoon),
                manuallyClosedCount: manuallyClosedCounts.afternoon
              },
              evening: {
                totalCabins: cabinIds.length,
                availableCabins: Math.max(0, cabinIds.length - bookedCounts.evening.size - manuallyClosedCounts.evening),
                manuallyClosedCount: manuallyClosedCounts.evening
              }
            };
          }
        }
        
        setAvailabilityData(availabilityMap);
      } catch (error) {
        console.error("Error fetching availability data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailabilityData();
  }, [location.id, location.cabinsCount]);

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
                  <div className="grid grid-cols-7 gap-1">
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

          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={displayImage}
              alt={location.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
          
          <div className="w-full h-60 bg-white flex items-center justify-center">
            <iframe
              title={`${location.name} Mapa`}
              src={googleMapsEmbedUrl}
              width="100%"
              height="100%"
              className="w-full h-full rounded-b-lg"
              style={{
                minHeight: 180,
                border: "none",
                borderRadius: "0 0 0.75rem 0.75rem",
                pointerEvents: 'auto'
              }}
              allowFullScreen
            />
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
