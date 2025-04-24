
import { useState, useEffect } from "react";
import LocationCard from "@/components/LocationCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Location } from "@/lib/types";
import { debugLog, debugError } from "@/utils/debugLogger";

const LocationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        debugLog("LocationsPage: Fetching locations");
        // First get all active locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('active', true)
          .order('name');
          
        if (locationsError) {
          debugError("LocationsPage: Error fetching locations:", locationsError);
          return;
        }

        // For each location, fetch the actual count of cabins
        const enhancedLocations = await Promise.all(locationsData.map(async (location) => {
          // Get cabins count for this location
          const { count, error: cabinsError } = await supabase
            .from('cabins')
            .select('*', { count: 'exact', head: true })
            .eq('location_id', location.id);
            
          if (cabinsError) {
            debugError(`LocationsPage: Error fetching cabins for location ${location.id}:`, cabinsError);
          }
          
          // Parse opening_hours safely
          let openingHours = { open: "09:00", close: "18:00" };
          
          if (location.opening_hours) {
            try {
              // Handle cases where opening_hours could be a string or object
              if (typeof location.opening_hours === 'string') {
                const parsed = JSON.parse(location.opening_hours);
                if (parsed && typeof parsed === 'object' && 'open' in parsed && 'close' in parsed) {
                  openingHours = {
                    open: String(parsed.open),
                    close: String(parsed.close)
                  };
                }
              } else if (typeof location.opening_hours === 'object' && location.opening_hours !== null) {
                const hours = location.opening_hours as any;
                if ('open' in hours && 'close' in hours) {
                  openingHours = {
                    open: String(hours.open),
                    close: String(hours.close)
                  };
                }
              }
            } catch (e) {
              debugError("LocationsPage: Error parsing opening hours:", e);
              // Keep default values if parsing fails
            }
          }

          return {
            id: location.id,
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            zipCode: location.zip_code,
            cabinsCount: count || 0, // Use actual count instead of location.cabins_count
            openingHours: openingHours,
            amenities: location.amenities || [],
            imageUrl: location.image_url || "",
            description: location.description || "",
            active: location.active
          };
        }));

        setLocations(enhancedLocations);
      } catch (error) {
        debugError("LocationsPage: Error processing locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);
  
  // Filter locations based on search query
  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.amenities.some(amenity => 
      amenity.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Encontre o Local Perfeito</h1>
        <p className="mt-4 text-gray-500">
          Descubra espaços equipados para profissionais de beleza em toda a cidade
        </p>
      </div>
      
      <div className="mt-8 flex items-center gap-2 border rounded-lg p-2 max-w-xl mx-auto">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, endereço ou comodidades..."
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">Carregando locais...</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.length > 0 ? (
            filteredLocations.map((location) => (
              <LocationCard key={location.id} location={location} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium">Nenhum local encontrado</h3>
              <p className="mt-1 text-gray-500">
                Tente ajustar sua busca ou remover filtros
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationsPage;
