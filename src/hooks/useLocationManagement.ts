import { useState } from "react";
import { Location, Cabin } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useLocationManagement = () => {
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);

  const loadUserLocations = async (userId: string) => {
    try {
      debugLog("useLocationManagement: Loading locations for user", userId);
      
      // Direct query to locations table without going through profiles first
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('owner_id', userId);
          
      if (locationsError) {
        debugError("useLocationManagement: Error fetching locations:", locationsError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus locais.",
          variant: "destructive",
        });
        return;
      }

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
        if (!selectedLocation) {
          setSelectedLocation(transformedLocations[0]);
          await loadCabinsForLocation(transformedLocations[0].id);
        }
      } else {
        debugLog("useLocationManagement: No locations found for user");
      }
    } catch (error) {
      debugError("useLocationManagement: Error processing locations:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar locais",
        variant: "destructive",
      });
    }
  };

  const loadCabinsForLocation = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('location_id', locationId);
      
      if (error) {
        console.error("Error loading cabins:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as cabines deste local.",
          variant: "destructive"
        });
        return;
      }
      
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
          console.error("Error parsing pricing data for cabin:", cabin.id, e);
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
          console.error("Error parsing availability data for cabin:", cabin.id, e);
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
      console.error("Error processing cabins:", error);
    }
  };

  const handleLocationChange = async (locationId: string) => {
    const location = userLocations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      await loadCabinsForLocation(locationId);
    }
  };

  const handleLocationCreated = (location: Location) => {
    setUserLocations(prev => [...prev, location]);
    setSelectedLocation(location);
    setLocationCabins([]);
  };

  const handleCabinAdded = (cabin: Cabin) => {
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
    }
  };

  const handleCabinUpdated = (cabin: Cabin) => {
    setLocationCabins(prev => prev.map(c => 
      c.id === cabin.id ? cabin : c
    ));
  };

  const handleLocationDeleted = async (locationId: string) => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);
      
      if (error) throw error;

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
    } catch (error) {
      console.error("Error deleting location:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o local.",
        variant: "destructive"
      });
    }
  };

  const handleCabinDeleted = async (cabinId: string) => {
    try {
      const { error } = await supabase
        .from('cabins')
        .delete()
        .eq('id', cabinId);
      
      if (error) {
        console.error("Error deleting cabin:", error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir a cabine.",
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
      }
    } catch (error) {
      console.error("Error processing cabin deletion:", error);
    }
  };

  return {
    userLocations,
    selectedLocation,
    locationCabins,
    loadUserLocations,
    handleLocationChange,
    handleLocationCreated,
    handleCabinAdded,
    handleCabinUpdated,
    handleLocationDeleted,
    handleCabinDeleted
  };
};
