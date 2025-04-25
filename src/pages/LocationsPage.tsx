
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
import { Search, Filter, Calendar as CalendarIcon, ChevronDown, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Location } from "@/lib/types";
import { debugLog, debugError } from "@/utils/debugLogger";
import { Badge } from "@/components/ui/badge";

interface FilterOptions {
  city: string;
  amenities: string[];
  cabinsMin: number;
  availableOn: Date | null;
}

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
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
          
        if (locationsError) {
          debugError("LocationsPage: Error fetching locations:", locationsError);
          return;
        }

        const enhancedLocations = await Promise.all(locationsData.map(async (location) => {
          const { count, error: cabinsError } = await supabase
            .from('cabins')
            .select('*', { count: 'exact', head: true })
            .eq('location_id', location.id);
            
          if (cabinsError) {
            debugError(`LocationsPage: Error fetching cabins for location ${location.id}:`, cabinsError);
          }
          
          let openingHours = { open: "09:00", close: "18:00" };
          
          if (location.opening_hours) {
            try {
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
            }
          }

          return {
            id: location.id,
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            zipCode: location.zip_code,
            cabinsCount: count || 0,
            openingHours: openingHours,
            amenities: location.amenities || [],
            imageUrl: location.image_url || "",
            description: location.description || "",
            active: location.active
          };
        }));

        extractFilterOptions(enhancedLocations);
        
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

  const fetchNextWeekAvailability = async (locationsList: Location[]) => {
    try {
      const availabilityMap: {[id: string]: number} = {};
      const startDate = new Date();
      const endDate = addDays(startDate, 7);
      
      for (const location of locationsList) {
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
        
        const totalSlots = cabins.length * 7;
        const availableSlots = totalSlots - (bookedCount || 0);
        const availabilityScore = Math.max(0, availableSlots);
        
        availabilityMap[location.id] = availabilityScore;
      }
      
      setNextWeekAvailability(availabilityMap);
    } catch (error) {
      debugError("Error fetching next week availability:", error);
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const resetFilters = () => {
    setActiveFilters({
      city: "",
      amenities: [],
      cabinsMin: 0,
      availableOn: null
    });
  };

  const handleFilterChange = (filterType: keyof FilterOptions, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleAmenityFilter = (amenity: string) => {
    setActiveFilters(prev => {
      const amenities = [...prev.amenities];
      const index = amenities.indexOf(amenity);
      
      if (index > -1) {
        amenities.splice(index, 1);
      } else {
        amenities.push(amenity);
      }
      
      return {
        ...prev,
        amenities
      };
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.city) count++;
    if (activeFilters.amenities.length > 0) count++;
    if (activeFilters.cabinsMin > 0) count++;
    if (activeFilters.availableOn) count++;
    return count;
  }, [activeFilters]);

  const filteredAndSortedLocations = useMemo(() => {
    let result = [...locations];
    
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
    
    if (activeFilters.city) {
      result = result.filter(location => location.city === activeFilters.city);
    }
    
    if (activeFilters.amenities.length > 0) {
      result = result.filter(location => 
        activeFilters.amenities.every(amenity => location.amenities.includes(amenity))
      );
    }
    
    if (activeFilters.cabinsMin > 0) {
      result = result.filter(location => location.cabinsCount >= activeFilters.cabinsMin);
    }
    
    if (activeFilters.availableOn) {
      const dateStr = format(activeFilters.availableOn, 'yyyy-MM-dd');
      debugLog(`Checking availability for date: ${dateStr}`);
      
      result = result.filter(location => nextWeekAvailability[location.id] > 0);
    }
    
    switch (sortBy) {
      case "availability":
        result.sort((a, b) => (nextWeekAvailability[b.id] || 0) - (nextWeekAvailability[a.id] || 0));
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "cabins":
        result.sort((a, b) => b.cabinsCount - a.cabinsCount);
        break;
      case "newest":
        // Fix: Sort by id since created_at isn't available in the Location type
        // This is a simple workaround assuming newer locations have higher/newer IDs
        // If there's an actual created_at field in the database, it should be added to the Location type
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
    }
    
    return result;
  }, [locations, searchQuery, activeFilters, sortBy, nextWeekAvailability]);

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-12 md:px-6 md:py-16 max-w-7xl">
        <div className="mx-auto max-w-3xl text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            Encontre o Local Perfeito
          </h1>
          <p className="mt-4 text-slate-600 text-lg">
            Descubra espaços equipados para profissionais de beleza em toda a região
          </p>
        </div>
        
        <div className="mt-8 space-y-4 max-w-5xl mx-auto">
          <Card className="shadow-md border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 bg-white rounded-lg border p-2">
                <Search className="h-5 w-5 text-slate-400" />
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
                  className="gap-1 border-slate-300 hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-primary text-white">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </div>
              
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Cidade</label>
                      <Select 
                        value={activeFilters.city} 
                        onValueChange={(value) => handleFilterChange('city', value)}
                      >
                        <SelectTrigger className="bg-white border-slate-300">
                          <SelectValue placeholder="Todas as cidades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas as cidades</SelectItem>
                          {allCities.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Qtd. Mínima de Cabines</label>
                      <Select 
                        value={activeFilters.cabinsMin.toString()} 
                        onValueChange={(value) => handleFilterChange('cabinsMin', parseInt(value))}
                      >
                        <SelectTrigger className="bg-white border-slate-300">
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
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Disponibilidade</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline" 
                            className={cn(
                              "w-full justify-between bg-white border-slate-300",
                              !activeFilters.availableOn && "text-slate-500"
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
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Ordenar por</label>
                      <Select 
                        value={sortBy} 
                        onValueChange={(value) => setSortBy(value as SortOption)}
                      >
                        <SelectTrigger className="bg-white border-slate-300">
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
                  
                  <div className="mt-6">
                    <label className="text-sm font-medium text-slate-700">Comodidades</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {allAmenities.map((amenity) => (
                        <Badge 
                          key={amenity}
                          variant={activeFilters.amenities.includes(amenity) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer",
                            activeFilters.amenities.includes(amenity) 
                              ? "bg-primary hover:bg-primary/90" 
                              : "hover:bg-slate-100"
                          )}
                          onClick={() => toggleAmenityFilter(amenity)}
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
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
                </div>
              )}
            </CardContent>
          </Card>

          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600 px-1">
              <span>Filtros ativos:</span>
              <div className="flex flex-wrap gap-1">
                {activeFilters.city && (
                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activeFilters.city}
                  </Badge>
                )}
                {activeFilters.cabinsMin > 0 && (
                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                    Min: {activeFilters.cabinsMin} cabines
                  </Badge>
                )}
                {activeFilters.availableOn && (
                  <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(activeFilters.availableOn, 'dd/MM/yyyy')}
                  </Badge>
                )}
                {activeFilters.amenities.map(amenity => (
                  <Badge key={amenity} variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="mt-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-2 text-slate-600">Carregando locais...</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6">
            {filteredAndSortedLocations.length > 0 ? (
              filteredAndSortedLocations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))
            ) : (
              <div className="col-span-full bg-slate-50 rounded-lg text-center py-16 border border-slate-200">
                <h3 className="text-xl font-medium text-slate-800">Nenhum local encontrado</h3>
                <p className="mt-2 text-slate-600">
                  Tente ajustar sua busca ou remover alguns filtros
                </p>
                {activeFilterCount > 0 && (
                  <Button 
                    onClick={resetFilters} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Limpar todos os filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationsPage;
