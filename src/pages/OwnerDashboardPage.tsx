import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Location, Cabin } from "@/lib/types";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { CabinManagement } from "@/components/owner/CabinManagement";
import { LocationsOverview } from "@/components/owner/LocationsOverview";
import { LocationSettings } from "@/components/owner/LocationSettings";
import { EmptyLocationState } from "@/components/owner/EmptyLocationState";
import { LocationOverview } from "@/components/owner/LocationOverview";
import { OwnerAddLocationModal } from "@/components/owner/OwnerAddLocationModal";

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTab, setActiveTab] = useState("locations");
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error("Erro ao buscar perfil:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seu perfil.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
          
        if (profile.user_type !== "owner") {
          toast({
            title: "Acesso negado",
            description: "Esta página é apenas para franqueados.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        const userData: User = {
          id: profile.id,
          name: profile.name || session.user.email?.split('@')[0] || "Franqueado",
          email: profile.email || session.user.email || "",
          userType: profile.user_type as "client" | "provider" | "owner",
          avatarUrl: profile.avatar_url,
          phoneNumber: profile.phone_number
        };
        
        setCurrentUser(userData);
        
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('*')
          .eq('owner_id', session.user.id);
          
        if (locationsError) {
          console.error("Erro ao buscar locais:", locationsError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seus locais.",
            variant: "destructive",
          });
        } else if (locationsData && locationsData.length > 0) {
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
                console.error("Error parsing opening hours:", e);
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
              description: location.description
            };
          });
          
          setUserLocations(transformedLocations);
          setSelectedLocation(transformedLocations[0]);
          
          if (transformedLocations[0]) {
            loadCabinsForLocation(transformedLocations[0].id);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar autenticação",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const loadCabinsForLocation = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('location_id', locationId);
      
      if (error) {
        console.error("Erro ao carregar cabines:", error);
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
      console.error("Erro ao processar cabines:", error);
    }
  };

  const handleLocationChange = (locationId: string) => {
    const location = userLocations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      loadCabinsForLocation(locationId);
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
  
  const handleCabinDeleted = async (cabinId: string) => {
    try {
      const { error } = await supabase
        .from('cabins')
        .delete()
        .eq('id', cabinId);
      
      if (error) {
        console.error("Erro ao excluir cabine:", error);
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
      console.error("Erro ao processar exclusão de cabine:", error);
    }
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
          loadCabinsForLocation(nextLocation.id);
        } else {
          setLocationCabins([]);
        }
      }
    } catch (error) {
      console.error("Erro ao excluir local:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o local.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard do Franqueado</h1>
        <p className="text-muted-foreground">
          Gerencie seus locais, cabines e equipamentos
        </p>
      </div>

      {!selectedLocation && userLocations.length === 0 ? (
        <EmptyLocationState onAddLocation={() => setAddModalOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          <OwnerSidebar
            userLocations={userLocations}
            selectedLocation={selectedLocation}
            onLocationChange={handleLocationChange}
            onLocationCreated={handleLocationCreated}
            onLocationDeleted={handleLocationDeleted}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          <div className="space-y-6">
            {selectedLocation && (
              <>
                <LocationOverview location={selectedLocation} />
                
                {activeTab === "locations" && (
                  <LocationsOverview 
                    selectedLocation={selectedLocation}
                    locationCabins={locationCabins} 
                  />
                )}
                
                {activeTab === "cabins" && (
                  <CabinManagement 
                    selectedLocation={selectedLocation}
                    locationCabins={locationCabins}
                    onCabinAdded={handleCabinAdded}
                    onCabinUpdated={handleCabinUpdated}
                    onCabinDeleted={handleCabinDeleted}
                  />
                )}
                
                {activeTab === "pricing" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Configuração de Preços</h2>
                    <p className="text-muted-foreground">Gerencie os preços das suas cabines.</p>
                  </div>
                )}
                
                {activeTab === "equipment" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Equipamentos</h2>
                    <p className="text-muted-foreground">Gerencie os equipamentos disponíveis.</p>
                  </div>
                )}
                
                {activeTab === "availability" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Disponibilidade</h2>
                    <p className="text-muted-foreground">Configure a disponibilidade das cabines.</p>
                  </div>
                )}
                
                {activeTab === "settings" && selectedLocation && (
                  <LocationSettings selectedLocation={selectedLocation} />
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      <OwnerAddLocationModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onLocationCreated={handleLocationCreated}
      />
    </div>
  );
};

export default OwnerDashboardPage;
