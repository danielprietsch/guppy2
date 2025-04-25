import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { DailyAvailabilityCell } from "./location/DailyAvailabilityCell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

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
      price?: number;
    };
    afternoon: {
      totalCabins: number;
      availableCabins: number;
      manuallyClosedCount: number;
      price?: number;
    };
    evening: {
      totalCabins: number;
      availableCabins: number;
      manuallyClosedCount: number;
      price?: number;
    };
  };
};

interface LocationCardProps {
  location: Location;
  displayLayout?: 'compact' | 'full';
}

const LocationCard = ({ location, displayLayout = 'full' }: LocationCardProps) => {
  const [availabilityData, setAvailabilityData] = useState<ShiftAvailabilityMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return new Date(today.setDate(today.getDate() - daysToSubtract));
  });
  const [ownerData, setOwnerData] = useState<{ name: string; avatarUrl: string | null } | null>(null);

  const displayImage = location.imageUrl || (() => {
    const imageIndex = parseInt(location.id.replace(/\D/g, ""), 10) % beautySalonImages.length;
    return beautySalonImages[imageIndex];
  })();

  const googleMapsEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg&q=${formatAddressForMaps(location.address, location.city, location.state)}&zoom=16`;

  useEffect(() => {
    const fetchAvailabilityData = async () => {
      setIsLoading(true);
      const startDate = currentDate;
      const availabilityMap: ShiftAvailabilityMap = {};

      try {
        if (/^\d+$/.test(location.id)) {
          for (let i = 0; i < 7; i++) {
            const date = addDays(startDate, i);
            const dateStr = format(date, "yyyy-MM-dd");
            const totalCabins = location.cabinsCount || 3;
            
            availabilityMap[dateStr] = {
              morning: {
                totalCabins,
                availableCabins: Math.floor(Math.random() * (totalCabins + 1)),
                manuallyClosedCount: 0
              },
              afternoon: {
                totalCabins,
                availableCabins: Math.floor(Math.random() * (totalCabins + 1)),
                manuallyClosedCount: 0
              },
              evening: {
                totalCabins,
                availableCabins: Math.floor(Math.random() * (totalCabins + 1)),
                manuallyClosedCount: 0
              }
            };
          }
          
          setAvailabilityData(availabilityMap);
          setIsLoading(false);
          return;
        }

        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('id, availability, pricing')
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
          
          let totalMorningPrice = 0;
          let totalAfternoonPrice = 0;
          let totalEveningPrice = 0;
          let morningPriceCount = 0;
          let afternoonPriceCount = 0;
          let eveningPriceCount = 0;

          cabins?.forEach(cabin => {
            const availability = cabin.availability as any;
            if (availability?.morning) {
              availableMorning++;
              const pricing = cabin.pricing as any;
              if (pricing?.defaultPricing?.morning) {
                totalMorningPrice += Number(pricing.defaultPricing.morning);
                morningPriceCount++;
              }
            } else {
              closedMorning++;
            }
            
            if (availability?.afternoon) {
              availableAfternoon++;
              const pricing = cabin.pricing as any;
              if (pricing?.defaultPricing?.afternoon) {
                totalAfternoonPrice += Number(pricing.defaultPricing.afternoon);
                afternoonPriceCount++;
              }
            } else {
              closedAfternoon++;
            }
            
            if (availability?.evening) {
              availableEvening++;
              const pricing = cabin.pricing as any;
              if (pricing?.defaultPricing?.evening) {
                totalEveningPrice += Number(pricing.defaultPricing.evening);
                eveningPriceCount++;
              }
            } else {
              closedEvening++;
            }
          });

          const morningPrice = morningPriceCount > 0 ? Math.round(totalMorningPrice / morningPriceCount) : undefined;
          const afternoonPrice = afternoonPriceCount > 0 ? Math.round(totalAfternoonPrice / afternoonPriceCount) : undefined;
          const eveningPrice = eveningPriceCount > 0 ? Math.round(totalEveningPrice / eveningPriceCount) : undefined;

          availabilityMap[dateStr] = {
            morning: {
              totalCabins,
              availableCabins: availableMorning,
              manuallyClosedCount: closedMorning,
              price: morningPrice
            },
            afternoon: {
              totalCabins,
              availableCabins: availableAfternoon,
              manuallyClosedCount: closedAfternoon,
              price: afternoonPrice
            },
            evening: {
              totalCabins,
              availableCabins: availableEvening,
              manuallyClosedCount: closedEvening,
              price: eveningPrice
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

  useEffect(() => {
    const fetchOwnerData = async () => {
      if (location.ownerId) {
        const { data: ownerProfile, error } = await supabase
          .from('profiles')
          .select('name, avatar_url')
          .eq('id', location.ownerId)
          .single();

        if (!error && ownerProfile) {
          setOwnerData({
            name: ownerProfile.name || 'Proprietário',
            avatarUrl: ownerProfile.avatar_url
          });
        }
      }
    };

    fetchOwnerData();
  }, [location.ownerId]);

  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(currentDate, i));

  if (displayLayout === 'compact') {
    return (
      <Link to={`/locations/${location.id}`} className="block hover:no-underline">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
          <CardContent className="p-0">
            <div className="relative h-48 overflow-hidden">
              <img 
                src={displayImage}
                alt={location.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-lg font-semibold text-white">{location.name}</h3>
                <p className="text-white/90 text-sm">{location.address}, {location.city}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{location.cabinsCount}</span> cabines
                </div>
                <div className="text-sm text-gray-600">
                  {location.openingHours.open} - {location.openingHours.close}
                </div>
              </div>
              {location.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {location.amenities.slice(0, 3).map((amenity, index) => (
                    <span
                      key={index}
                      className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-700"
                    >
                      {amenity}
                    </span>
                  ))}
                  {location.amenities.length > 3 && (
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-700">
                      +{location.amenities.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="relative">
      <Link to={`/locations/${location.id}`} className="block hover:no-underline">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <h3 className="font-semibold text-2xl text-gray-800 mb-3">{location.name}</h3>
                <p className="text-lg text-gray-600 mb-4">{location.address}, {location.city}</p>
                
                {ownerData && (
                  <div className="flex items-center space-x-3 mb-4 p-3 bg-slate-50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={ownerData.avatarUrl || undefined} alt={ownerData.name} />
                      <AvatarFallback>
                        <User className="h-5 w-5 text-slate-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-600">Proprietário</p>
                      <p className="font-medium text-slate-900">{ownerData.name}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 text-base">
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium mr-2">Quantidade de cabines:</span>
                    <span>{location.cabinsCount}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium mr-2">Horário de Funcionamento:</span>
                    <span>{location.openingHours.open} - {location.openingHours.close}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {location.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="text-sm bg-slate-100 px-3 py-1 rounded-full text-slate-700"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-1">
                <div className="h-64 overflow-hidden rounded-lg shadow-sm">
                  <img
                    src={displayImage}
                    alt={location.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <div className="h-64 rounded-lg overflow-hidden shadow-sm">
                  <iframe
                    title={`${location.name} Mapa`}
                    src={googleMapsEmbedUrl}
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                    style={{ border: "none" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-md shadow-inner">
              <h4 className="text-lg font-medium mb-4 text-gray-700">Disponibilidade próximos dias</h4>
              {isLoading ? (
                <div className="flex justify-center p-2">
                  <p className="text-base">Carregando...</p>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-2">
                  <div className="text-base space-y-[1.35rem] pt-7 font-medium text-gray-600">
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
                        cabinId={location.id}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default LocationCard;
