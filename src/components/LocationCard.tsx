
import { useState } from "react";
import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

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
  };
};

interface LocationCardProps {
  location: Location;
}

const LocationCard = ({ location }: LocationCardProps) => {
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate] = useState(new Date());

  const displayImage = location.imageUrl || (() => {
    const imageIndex = parseInt(location.id.replace(/\D/g, ""), 10) % beautySalonImages.length;
    return beautySalonImages[imageIndex];
  })();

  const googleMapsEmbedUrl = `https://www.google.com/maps?&q=${formatAddressForMaps(location.address, location.city, location.state)}&z=18&output=embed`;

  useEffect(() => {
    const fetchAvailabilityData = async () => {
      if (!showAvailability) return;
      
      setIsLoading(true);
      const startDate = new Date();
      const availabilityMap: AvailabilityMap = {};

      // Generate next 7 days
      for (let i = 0; i < 7; i++) {
        const date = addDays(startDate, i);
        const dateStr = format(date, "yyyy-MM-dd");
        availabilityMap[dateStr] = { 
          totalCabins: location.cabinsCount, 
          availableCabins: 0 
        };
      }

      try {
        // Get all cabins for this location
        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('id')
          .eq('location_id', location.id);

        if (cabinsError) throw cabinsError;
        
        if (cabins && cabins.length > 0) {
          const cabinIds = cabins.map(cabin => cabin.id);
          
          // For each date, check bookings for all cabins
          for (let i = 0; i < 7; i++) {
            const date = addDays(startDate, i);
            const dateStr = format(date, "yyyy-MM-dd");
            
            // Get bookings for this date for all cabins of this location
            const { data: bookings, error: bookingsError } = await supabase
              .from('bookings')
              .select('cabin_id, shift')
              .in('cabin_id', cabinIds)
              .eq('date', dateStr)
              .eq('status', 'confirmed');
              
            if (bookingsError) throw bookingsError;
            
            // Calculate available cabins (simple calculation: total cabins - booked cabins)
            // This is a simplification - in reality you'd need to account for shifts
            const bookedCabinIds = new Set(bookings?.map(b => b.cabin_id) || []);
            const availableCabins = cabinIds.length - bookedCabinIds.size;
            
            availabilityMap[dateStr] = {
              totalCabins: cabinIds.length,
              availableCabins: availableCabins > 0 ? availableCabins : 0
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
  }, [showAvailability, location.id, location.cabinsCount]);

  const toggleAvailabilityCalendar = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    setShowAvailability(!showAvailability);
  };

  // Generate dates for the next 7 days
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    return addDays(currentDate, i);
  });

  // Function to determine availability color class
  const getAvailabilityColorClass = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const data = availabilityData[dateStr];
    
    if (!data) return "bg-gray-200"; // No data
    
    const availabilityRatio = data.availableCabins / data.totalCabins;
    if (availabilityRatio >= 0.5) return "bg-green-500"; // Good availability (50%+)
    if (availabilityRatio > 0) return "bg-yellow-500"; // Limited availability
    return "bg-red-500"; // No availability
  };

  return (
    <div className="relative">
      <Link to={`/locations/${location.id}`}>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{location.name}</h3>
              <button 
                onClick={toggleAvailabilityCalendar}
                className="flex items-center text-primary text-sm hover:underline"
              >
                <Calendar className="h-4 w-4 mr-1" />
                {!showAvailability ? "Ver disponibilidade" : "Ocultar"}
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
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {nextDays.map((date, i) => (
                      <div key={i} className="text-xs">
                        <div className="font-medium mb-1">
                          {format(date, "EEE", { locale: ptBR })}
                        </div>
                        <div className="text-[10px] mb-1">
                          {format(date, "dd/MM")}
                        </div>
                        <div className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center ${getAvailabilityColorClass(date)} text-white`}>
                          {availabilityData[format(date, "yyyy-MM-dd")]?.availableCabins || 0}
                        </div>
                      </div>
                    ))}
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
