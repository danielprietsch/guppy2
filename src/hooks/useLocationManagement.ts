
import { useState, useEffect } from "react";
import { Location, Cabin } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useLocationManagement = () => {
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserLocations = async (userId: string) => {
    try {
      setIsLoading(true);
      debugLog("useLocationManagement: Loading locations for user", userId);
      
      // Usar a função fetch_user_locations que criamos no SQL
      const { data: locationsData, error: locationsError } = await supabase
        .rpc('fetch_user_locations', { p_owner_id: userId });
          
      if (locationsError) {
        debugError("useLocationManagement: Error fetching locations:", locationsError);
        
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus locais. Por favor, tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log("📋 Locations data received:", locationsData);
      
      // Handle null/undefined data
      if (!locationsData) {
        debugLog("useLocationManagement: No locations data returned");
        setUserLocations([]);
        return;
      }
      
      // Ensure locationsData is treated as an array
      const locationsArray = Array.isArray(locationsData) ? locationsData : [];
      processLocationData(locationsArray);
      
    } catch (error) {
      debugError("useLocationManagement: Error processing locations:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar locais",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processLocationData = (locationsData: any[]) => {
    if (locationsData && locationsData.length > 0) {
      const transformedLocations: Location[] = locationsData.map(location => {
        let openingHours = { open: "09:00", close: "18:00" };
        
        if (location.opening_hours) {
          try {
            const hoursData = typeof location.opening_hours === 'string' 
              ? JSON.parse(location.opening_hours)
              : location.opening_hours;
            
            if (typeof hoursData === 'object' && hoursData !== null) {
              openingHours = {
                open: typeof hoursData.open === 'string' ? hoursData.open : "09:00",
                close: typeof hoursData.close === 'string' ? hoursData.close : "18:00"
              };
            }
          } catch (e) {
            debugError("useLocationManagement: Error parsing opening hours:", e);
          }
        }
        
        return {
          id: location.id,
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zip_code,
          cabinsCount: location.cabins_count || 0,
          openingHours: openingHours,
          amenities: location.amenities || [],
          imageUrl: location.image_url || "",
          description: location.description,
          active: location.active
        };
      });
      
      debugLog(`useLocationManagement: Loaded ${transformedLocations.length} locations`);
      setUserLocations(transformedLocations);
      
      // Se não houver localização selecionada e temos localizações, selecione a primeira
      if (!selectedLocation && transformedLocations.length > 0) {
        debugLog("Setting first location as selected:", transformedLocations[0].name);
        setSelectedLocation(transformedLocations[0]);
        loadCabinsForLocation(transformedLocations[0].id);
      }
    } else {
      debugLog("useLocationManagement: No locations found for user");
      setUserLocations([]);
    }
  };

  const loadCabinsForLocation = async (locationId: string) => {
    if (!locationId) {
      debugLog("useLocationManagement: No location ID provided for loading cabins");
      return;
    }
    
    try {
      setIsLoading(true);
      debugLog("useLocationManagement: Loading cabins for location", locationId);
      
      const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('location_id', locationId);
      
      if (error) {
        debugError("useLocationManagement: Error loading cabins:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as cabines deste local.",
          variant: "destructive"
        });
        setLocationCabins([]);
        return;
      }
      
      if (!data || data.length === 0) {
        debugLog("useLocationManagement: No cabins found for location", locationId);
        setLocationCabins([]);
        return;
      }
      
      debugLog(`useLocationManagement: Loaded ${data.length} cabins`);
      
      const transformedCabins: Cabin[] = data.map(cabin => {
        const defaultPricing = {
          defaultPricing: {},
          specificDates: {}
        };
        
        const defaultAvailability = {
          morning: true,
          afternoon: true, 
          evening: true
        };
        
        let cabinPricing = defaultPricing;
        try {
          if (cabin.pricing) {
            if (typeof cabin.pricing === 'string') {
              cabinPricing = JSON.parse(cabin.pricing);
            } else if (typeof cabin.pricing === 'object' && cabin.pricing !== null) {
              const pricingObj = cabin.pricing as any;
              if (pricingObj.defaultPricing !== undefined || pricingObj.specificDates !== undefined) {
                cabinPricing = {
                  defaultPricing: pricingObj.defaultPricing || {},
                  specificDates: pricingObj.specificDates || {}
                };
              }
            }
          }
        } catch (e) {
          debugError("Error parsing pricing data for cabin:", cabin.id, e);
        }
        
        let cabinAvailability = defaultAvailability;
        try {
          if (cabin.availability) {
            if (typeof cabin.availability === 'string') {
              cabinAvailability = JSON.parse(cabin.availability);
            } else if (typeof cabin.availability === 'object' && cabin.availability !== null) {
              const availObj = cabin.availability as any;
              cabinAvailability = {
                morning: availObj.morning !== false,
                afternoon: availObj.afternoon !== false,
                evening: availObj.evening !== false
              };
            }
          }
        } catch (e) {
          debugError("Error parsing availability data for cabin:", cabin.id, e);
        }
        
        return {
          id: cabin.id,
          locationId: cabin.location_id,
          name: cabin.name,
          description: cabin.description || "",
          equipment: cabin.equipment || [],
          imageUrl: cabin.image_url || "",
          price: 0,
          availability: cabinAvailability,
          pricing: cabinPricing as Cabin['pricing']
        };
      });
      
      setLocationCabins(transformedCabins);
    } catch (error) {
      debugError("Error processing cabins:", error);
      setLocationCabins([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = async (locationId: string) => {
    debugLog("useLocationManagement: Changing selected location to", locationId);
    const location = userLocations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      await loadCabinsForLocation(locationId);
    }
  };

  const handleLocationCreated = (location: Location) => {
    debugLog("useLocationManagement: New location created", location.id);
    setUserLocations(prev => [...prev, location]);
    setSelectedLocation(location);
    setLocationCabins([]);
  };

  const handleCabinAdded = async (cabin: Cabin) => {
    debugLog("useLocationManagement: New cabin added", cabin.id);
    setLocationCabins(prev => [...prev, cabin]);
    
    if (selectedLocation) {
      const updatedLocation = {
        ...selectedLocation,
        cabinsCount: (selectedLocation.cabinsCount || 0) + 1
      };
      setSelectedLocation(updatedLocation);
      
      setUserLocations(prev => prev.map(loc => 
        loc.id === updatedLocation.id ? updatedLocation : loc
      ));
      
      // Atualizar o contador de cabines diretamente no banco de dados
      await supabase
        .from('locations')
        .update({ cabins_count: updatedLocation.cabinsCount })
        .eq('id', updatedLocation.id);
    }
  };

  const handleCabinUpdated = (cabin: Cabin) => {
    debugLog("useLocationManagement: Cabin updated", cabin.id);
    setLocationCabins(prev => prev.map(c => 
      c.id === cabin.id ? cabin : c
    ));
  };

  const handleLocationDeleted = async (locationId: string) => {
    try {
      debugLog("useLocationManagement: Deleting location", locationId);
      
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);
      
      if (error) {
        debugError("useLocationManagement: Error deleting location:", error);
        throw error;
      }

      setUserLocations(prev => prev.filter(loc => loc.id !== locationId));
      
      if (selectedLocation?.id === locationId) {
        const nextLocation = userLocations.find(loc => loc.id !== locationId);
        setSelectedLocation(nextLocation || null);
        
        if (nextLocation) {
          await loadCabinsForLocation(nextLocation.id);
        } else {
          setLocationCabins([]);
        }
      }
    } catch (error: any) {
      debugError("Error deleting location:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o local: " + (error.message || "Erro desconhecido"),
        variant: "destructive"
      });
    }
  };

  const handleCabinDeleted = async (cabinId: string) => {
    try {
      debugLog("useLocationManagement: Deleting cabin", cabinId);
      
      const { error } = await supabase
        .from('cabins')
        .delete()
        .eq('id', cabinId);
      
      if (error) {
        debugError("useLocationManagement: Error deleting cabin:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a cabine: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      setLocationCabins(prev => prev.filter(c => c.id !== cabinId));
      
      if (selectedLocation) {
        const updatedLocation = {
          ...selectedLocation,
          cabinsCount: Math.max(0, (selectedLocation.cabinsCount || 0) - 1)
        };
        setSelectedLocation(updatedLocation);
        
        setUserLocations(prev => prev.map(loc => 
          loc.id === updatedLocation.id ? updatedLocation : loc
        ));
        
        // Atualizar o contador de cabines diretamente no banco de dados
        await supabase
          .from('locations')
          .update({ cabins_count: updatedLocation.cabinsCount })
          .eq('id', updatedLocation.id);
      }
    } catch (error: any) {
      debugError("Error processing cabin deletion:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir cabine: " + (error.message || "Erro desconhecido"),
        variant: "destructive"
      });
    }
  };

  return {
    userLocations,
    selectedLocation,
    locationCabins,
    isLoading,
    loadUserLocations,
    handleLocationChange,
    handleLocationCreated,
    handleCabinAdded,
    handleCabinUpdated,
    handleLocationDeleted,
    handleCabinDeleted
  };
};
