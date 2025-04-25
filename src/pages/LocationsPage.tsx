import { useState, useEffect, useMemo } from "react";
import LocationCard from "@/components/LocationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Search, Filter, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Location } from "@/lib/types";
import { debugLog, debugError } from "@/utils/debugLogger";
import { Badge } from "@/components/ui/badge";

// Type for available filters
interface FilterOptions {
  city: string;
  amenities: string[];
  cabinsMin: number;
  availableOn: Date | null;
}

// Type for sorting options
type SortOption = "availability" | "name" | "cabins" | "newest";

const LocationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    city: "",
    amenities: [],
    cabinsMin: 0,
    availableOn: null
  });
  const [sortBy, setSortBy] = useState<SortOption>("availability");
  const [nextWeekAvailability, setNextWeekAvailability] = useState<{[id: string]: number}>({});
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allAmenities, setAllAmenities] = useState<string[]>([]);
  
  // Function to get all unique cities and amenities from locations
  const extractFilterOptions = (locationsList: Location[]) => {
    const cities = new Set<string>();
    const amenities = new Set<string>();
    
    locationsList.forEach(location => {
      if (location.city) cities.add(location.city);
      location.amenities.forEach(amenity => amenities.add(amenity));
    });
    
    setAllCities(Array.from(cities).sort());
    setAllAmenities(Array.from(amenities).sort());
  };
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        debugLog("LocationsPage: Fetching locations");
        // First get all active locations
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
          
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

        // Extract filter options
        extractFilterOptions(enhancedLocations);
        
        // Get availability data for the next 7 days
        await fetchNextWeekAvailability(enhancedLocations);
        
        setLocations(enhancedLocations);
      } catch (error) {
        debugError("LocationsPage: Error processing locations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);
  
  // Function to fetch next week's availability for each location
  const fetchNextWeekAvailability = async (locationsList: Location[]) => {
    try {
      const availabilityMap: {[id: string]: number} = {};
      const startDate = new Date();
      const endDate = addDays(startDate, 7);
      
      // For each location, check availability for the next 7 days
      for (const location of locationsList) {
        // Get all cabins for this location
        const { data: cabins, error: cabinsError } = await supabase
          .from('cabins')
          .select('id')
          .eq('location_id', location.id);
          
        if (cabinsError) {
          debugError(`Error getting cabins for location ${location.id}:`, cabinsError);
          continue;
        }
        
        if (!cabins || cabins.length === 0) {
          availabilityMap[location.id] = 0;
          continue;
        }
        
        const cabinIds = cabins.map(cabin => cabin.id);
        
        // Count bookings for these cabins in the next 7 days
        const { count: bookedCount, error: bookingsError } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('cabin_id', cabinIds)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .eq('status', 'confirmed');
          
        if (bookingsError) {
          debugError(`Error counting bookings for location ${location.id}:`, bookingsError);
          continue;
        }
        
        // Calculate an availability score (total cabins * 7 days - booked slots)
        const totalSlots = cabins.length * 7; // All potential slots for 7 days
        const availableSlots = totalSlots - (bookedCount || 0);
        const availabilityScore = Math.max(0, availableSlots);
        
        availabilityMap[location.id] = availabilityScore;
      }
      
      setNextWeekAvailability(availabilityMap);
    } catch (error) {
      debugError("Error fetching next week availability:", error);
    }
  };
  
  // Toggle filter visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setActiveFilters({
      city: "",
      amenities: [],
      cabinsMin: 0,
      availableOn: null
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Toggle amenity filter
  const toggleAmenityFilter = (amenity: string) => {
    setActiveFilters(prev => {
      const amenities = [...prev.amenities];
      const index = amenities.indexOf(amenity);
      
      if (index > -1) {
        // Remove if already exists
        amenities.splice(index, 1);
      } else {
        // Add if doesn't exist
        amenities.push(amenity);
      }
      
      return {
        ...prev,
        amenities
      };
    });
  };
  
  // Active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.city) count++;
    if (activeFilters.amenities.length > 0) count++;
    if (activeFilters.cabinsMin > 0) count++;
    if (activeFilters.availableOn) count++;
    return count;
  }, [activeFilters]);

  // Apply all filters and sorting to locations
  const filteredAndSortedLocations = useMemo(() => {
    let result = [...locations];
    
    // Apply text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(location => 
        location.name.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query) ||
        location.city.toLowerCase().includes(query) ||
        location.state.toLowerCase().includes(query) ||
        location.amenities.some(amenity => amenity.toLowerCase().includes(query))
      );
    }
    
    // Apply city filter
    if (activeFilters.city) {
      result = result.filter(location => location.city === activeFilters.city);
    }
    
    // Apply amenities filter
    if (activeFilters.amenities.length > 0) {
      result = result.filter(location => 
        activeFilters.amenities.every(amenity => location.amenities.includes(amenity))
      );
    }
    
    // Apply minimum cabins filter
    if (activeFilters.cabinsMin > 0) {
      result = result.filter(location => location.cabinsCount >= activeFilters.cabinsMin);
    }
    
    // Apply date availability filter (placeholder - would need actual booking data)
    if (activeFilters.availableOn) {
      // This would check real availability, for now it's just a placeholder
      // In a real implementation, we would check the actual bookings for this date
      const dateStr = format(activeFilters.availableOn, 'yyyy-MM-dd');
      debugLog(`Checking availability for date: ${dateStr}`);
      
      // Since we don't have real availability data for specific dates in this implementation,
      // We use the overall availability score as a proxy
      result = result.filter(location => nextWeekAvailability[location.id] > 0);
    }
    
    // Apply sorting
    switch (sortBy) {
      case "availability":
        // Sort by availability in the next week (highest first)
        result.sort((a, b) => (nextWeekAvailability[b.id] || 0) - (nextWeekAvailability[a.id] || 0));
        break;
      case "name":
        // Sort alphabetically by name
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "cabins":
        // Sort by number of cabins (highest first)
        result.sort((a, b) => b.cabinsCount - a.cabinsCount);
        break;
      case "newest":
        // Newest locations should be first - we assume the order from the DB is correct
        // No additional sorting needed as the initial data is already ordered by created_at
        break;
    }
    
    return result;
  }, [locations, searchQuery, activeFilters, sortBy, nextWeekAvailability]);
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Encontre o Local Perfeito</h1>
        <p className="mt-4 text-gray-500">
          Descubra espaços equipados para profissionais de beleza em toda a cidade
        </p>
      </div>
      
      <div className="mt-8 space-y-4 max-w-5xl mx-auto">
        {/* Search bar */}
        <div className="flex items-center gap-2 border rounded-lg p-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, endereço ou comodidades..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFilters}
            className="gap-1"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
        
        {/* Filter and sort section */}
        {showFilters && (
          <Card className="p-4">
            <CardContent className="p-0 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* City filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cidade</label>
                  <Select 
                    value={activeFilters.city} 
                    onValueChange={(value) => handleFilterChange('city', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as cidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as cidades</SelectItem>
                      {allCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Minimum cabins filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Qtd. Mínima de Cabines</label>
                  <Select 
                    value={activeFilters.cabinsMin.toString()} 
                    onValueChange={(value) => handleFilterChange('cabinsMin', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer quantidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Qualquer quantidade</SelectItem>
                      <SelectItem value="1">1+ cabines</SelectItem>
                      <SelectItem value="2">2+ cabines</SelectItem>
                      <SelectItem value="5">5+ cabines</SelectItem>
                      <SelectItem value="10">10+ cabines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Date availability filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Disponibilidade</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-between",
                          !activeFilters.availableOn && "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {activeFilters.availableOn ? format(activeFilters.availableOn, 'dd/MM/yyyy') : 'Qualquer data'}
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={activeFilters.availableOn || undefined}
                        onSelect={(date) => handleFilterChange('availableOn', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Sort by filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select 
                    value={sortBy} 
                    onValueChange={(value) => setSortBy(value as SortOption)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="availability">Disponibilidade</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                      <SelectItem value="cabins">Mais cabines</SelectItem>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Amenities filter */}
              <div className="mt-6">
                <label className="text-sm font-medium">Comodidades</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allAmenities.map((amenity) => (
                    <Badge 
                      key={amenity}
                      variant={activeFilters.amenities.includes(amenity) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleAmenityFilter(amenity)}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Filter actions */}
              <div className="flex justify-end mt-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetFilters}
                  className="mr-2"
                >
                  Limpar filtros
                </Button>
                <Button 
                  size="sm" 
                  onClick={toggleFilters}
                >
                  Aplicar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Results section */}
      {loading ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">Carregando locais...</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedLocations.length > 0 ? (
            filteredAndSortedLocations.map((location) => (
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
