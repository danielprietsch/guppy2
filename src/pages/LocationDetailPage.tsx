
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Location, Cabin } from "@/lib/types";
import CabinCard from "@/components/CabinCard";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";

const beautySalonImage =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

function formatAddressForMaps(address: string, city: string, state: string) {
  const full = `${address}, ${city}, ${state}`.replace(/\s/g, "+");
  return encodeURIComponent(full);
}

const LocationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocationDetails = async () => {
      try {
        if (!id) return;
        
        debugLog(`LocationDetailPage: Fetching location with id ${id}`);
        
        // Fetch location details
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', id)
          .single();
        
        if (locationError) {
          debugError("LocationDetailPage: Error fetching location:", locationError);
          setLoading(false);
          return;
        }

        if (!locationData) {
          debugLog("LocationDetailPage: No location found with id:", id);
          setLoading(false);
          return;
        }
        
        // Parse opening_hours safely
        let openingHours = { open: "09:00", close: "18:00" };
        
        if (locationData.opening_hours) {
          try {
            if (typeof locationData.opening_hours === 'string') {
              const parsed = JSON.parse(locationData.opening_hours);
              if (parsed && typeof parsed === 'object' && 'open' in parsed && 'close' in parsed) {
                openingHours = {
                  open: String(parsed.open),
                  close: String(parsed.close)
                };
              }
            } else if (typeof locationData.opening_hours === 'object' && locationData.opening_hours !== null) {
              const hours = locationData.opening_hours as any;
              if ('open' in hours && 'close' in hours) {
                openingHours = {
                  open: String(hours.open),
                  close: String(hours.close)
                };
              }
            }
          } catch (e) {
            debugError("LocationDetailPage: Error parsing opening hours:", e);
          }
        }
        
        // Transform location data
        const transformedLocation: Location = {
          id: locationData.id,
          name: locationData.name,
          address: locationData.address,
          city: locationData.city,
          state: locationData.state,
          zipCode: locationData.zip_code,
          cabinsCount: locationData.cabins_count || 0,
          openingHours: openingHours,
          amenities: locationData.amenities || [],
          imageUrl: locationData.image_url || beautySalonImage,
          description: locationData.description || "",
          active: locationData.active
        };
        
        setLocation(transformedLocation);
        
        // Fetch cabins for this location
        const { data: cabinsData, error: cabinsError } = await supabase
          .from('cabins')
          .select('*')
          .eq('location_id', id);
        
        if (cabinsError) {
          debugError("LocationDetailPage: Error fetching cabins:", cabinsError);
        } else {
          // Transform cabins data
          const transformedCabins: Cabin[] = cabinsData.map(cabin => {
            let availability = { morning: true, afternoon: true, evening: true };
            if (cabin.availability) {
              if (typeof cabin.availability === 'string') {
                try {
                  const parsed = JSON.parse(cabin.availability);
                  if (parsed && typeof parsed === 'object') {
                    availability = {
                      morning: parsed.morning !== false,
                      afternoon: parsed.afternoon !== false,
                      evening: parsed.evening !== false
                    };
                  }
                } catch (e) {
                  debugError("LocationDetailPage: Error parsing cabin availability:", e);
                }
              } else if (typeof cabin.availability === 'object' && cabin.availability !== null) {
                const avail = cabin.availability as any;
                availability = {
                  morning: avail.morning !== false,
                  afternoon: avail.afternoon !== false,
                  evening: avail.evening !== false
                };
              }
            }
            
            // Parse and transform pricing data to match Cabin type
            let pricingObject = {
              defaultPricing: {},
              specificDates: {}
            };
            
            try {
              if (cabin.pricing) {
                if (typeof cabin.pricing === 'string') {
                  const parsedPricing = JSON.parse(cabin.pricing);
                  if (parsedPricing && typeof parsedPricing === 'object') {
                    pricingObject = {
                      defaultPricing: parsedPricing.defaultPricing || {},
                      specificDates: parsedPricing.specificDates || {}
                    };
                  }
                } else if (typeof cabin.pricing === 'object' && cabin.pricing !== null) {
                  const pricingData = cabin.pricing as any;
                  pricingObject = {
                    defaultPricing: pricingData.defaultPricing || {},
                    specificDates: pricingData.specificDates || {}
                  };
                }
              }
            } catch (e) {
              debugError("LocationDetailPage: Error parsing cabin pricing:", e);
            }
            
            // Extract price from pricing data or set a default value
            let cabinPrice = 0;
            
            try {
              // Try to get price from defaultPricing.weekday if it exists
              if (pricingObject.defaultPricing && 
                  typeof pricingObject.defaultPricing === 'object' && 
                  pricingObject.defaultPricing !== null) {
                    
                const defaultPricing = pricingObject.defaultPricing as any;
                
                if (defaultPricing.weekday && typeof defaultPricing.weekday === 'number') {
                  cabinPrice = defaultPricing.weekday;
                } else if (defaultPricing.weekend && typeof defaultPricing.weekend === 'number') {
                  cabinPrice = defaultPricing.weekend;
                }
              }
            } catch (e) {
              debugError("LocationDetailPage: Error extracting cabin price:", e);
            }
            
            return {
              id: cabin.id,
              locationId: cabin.location_id,
              name: cabin.name,
              description: cabin.description || "",
              equipment: cabin.equipment || [],
              imageUrl: cabin.image_url || "",
              availability: availability,
              price: cabinPrice,
              pricing: pricingObject
            };
          });
          
          setLocationCabins(transformedCabins);
        }
      } catch (error) {
        debugError("LocationDetailPage: Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocationDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <p className="text-lg">Carregando informações do local...</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <h2>Local não encontrado</h2>
        <Link to="/locations">
          <Button className="mt-4">Voltar para Locais</Button>
        </Link>
      </div>
    );
  }

  const googleMapEmbedUrl = `https://www.google.com/maps?q=${formatAddressForMaps(location.address, location.city, location.state)}&output=embed`;

  return (
    <div>
      <div className="relative h-64 md:h-96 flex flex-col md:flex-row">
        <div className="relative w-full md:w-3/4 h-64 md:h-96">
          <img
            src={location.imageUrl || beautySalonImage}
            alt="Salão de beleza"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <Link to="/locations" className="flex items-center gap-2 text-sm hover:underline mb-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Locais
            </Link>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <div className="mt-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {location.address}, {location.city}, {location.state}
              </span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/4 flex items-center justify-center md:relative mt-2 md:mt-0">
          <div className="w-full h-44 md:h-full md:rounded-lg md:shadow-lg overflow-hidden">
            <iframe
              title="Mapa"
              src={googleMapEmbedUrl}
              width="100%"
              height="100%"
              className="border-0 w-full h-full"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ minHeight: '160px', borderRadius: '0.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="container px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold">Sobre este local</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium">Cabines disponíveis</h3>
                <p className="text-gray-500">{location.cabinsCount} cabines equipadas para serviços de beleza</p>
              </div>
              <div>
                <h3 className="font-medium">Horário de funcionamento</h3>
                <div className="mt-1 flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    {location.openingHours.open} - {location.openingHours.close}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Comodidades</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {location.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
              {location.description && (
                <div>
                  <h3 className="font-medium">Descrição</h3>
                  <p className="text-gray-500 mt-1">{location.description}</p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Preços</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Domingo a Quinta</span>
                <span className="font-medium">R$ 100,00 / turno</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sexta e Sábado</span>
                <span className="font-medium">R$ 150,00 / turno</span>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-medium">Turnos disponíveis</h4>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md border p-2">
                  <div>Manhã</div>
                  <div className="mt-1 text-xs text-gray-500">
                    08:00 - 12:00
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div>Tarde</div>
                  <div className="mt-1 text-xs text-gray-500">
                    13:00 - 17:00
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div>Noite</div>
                  <div className="mt-1 text-xs text-gray-500">
                    18:00 - 22:00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold">Cabines disponíveis</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {locationCabins.length > 0 ? (
              locationCabins.map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} location={location} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium">Nenhuma cabine disponível</h3>
                <p className="mt-1 text-gray-500">
                  No momento, não há cabines disponíveis neste local.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailPage;
