import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Location, Cabin } from "@/lib/types";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

// Import components
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { LocationsOverview } from "@/components/owner/LocationsOverview";
import { PricingSettings } from "@/components/owner/PricingSettings";
import { EquipmentSettings } from "@/components/owner/EquipmentSettings";
import { AvailabilitySettings } from "@/components/owner/AvailabilitySettings";
import { LocationSettings } from "@/components/owner/LocationSettings";
import { CabinManagement } from "@/components/owner/CabinManagement";

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState("locations");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        console.log("Checking auth status...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("No session found, redirecting to login");
          toast.error("Faça login para acessar esta página");
          navigate("/login");
          return;
        }

        console.log("Session found:", session);
        
        // Get user profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          
          // Tentar criar um perfil a partir dos metadados do usuário
          if (session.user.user_metadata) {
            const userType = session.user.user_metadata.userType || "owner";
            
            if (userType !== "owner") {
              toast.error("Você não tem permissão para acessar esta página.");
              navigate("/");
              return;
            }
            
            const newProfile = {
              id: session.user.id,
              name: session.user.user_metadata.name || session.user.email?.split('@')[0] || "Usuário",
              email: session.user.email,
              user_type: userType,
              avatar_url: session.user.user_metadata.avatar_url || ""
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
              
            if (insertError) {
              console.error("Error creating profile:", insertError);
              toast.error("Erro ao criar perfil");
              navigate("/login");
              return;
            }
            
            setCurrentUser({
              id: session.user.id,
              name: newProfile.name,
              email: newProfile.email || "",
              userType: userType as "client" | "provider" | "owner",
              avatarUrl: newProfile.avatar_url
            });
          } else {
            toast.error("Perfil não encontrado");
            navigate("/login");
            return;
          }
        } else if (profile) {
          // Check if user is owner type
          if (profile.user_type !== "owner") {
            toast.error("Você não tem permissão para acessar esta página.");
            navigate("/");
            return;
          }
          
          // Set current user
          setCurrentUser({
            id: session.user.id,
            name: profile.name || session.user.email?.split('@')[0] || "Usuário",
            email: profile.email || session.user.email || "",
            userType: profile.user_type as "client" | "provider" | "owner",
            avatarUrl: profile.avatar_url,
            phoneNumber: profile.phone_number
          });
        }
        
        setAuthChecked(true);
        
        // Load user locations
        await loadUserLocations(session.user.id);
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast.error("Erro ao verificar autenticação");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_OUT") {
          navigate("/login");
        } else if (event === "SIGNED_IN" && session) {
          // Se o usuário acabou de fazer login, recarregar a página
          window.location.reload();
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const loadUserLocations = async (userId: string) => {
    try {
      console.log("Loading locations for user:", userId);
      
      // Get owned locations from database
      const { data: locations, error } = await supabase
        .from('locations')
        .select('*')
        .eq('owner_id', userId);
      
      if (error) {
        throw error;
      }
      
      console.log("Loaded locations:", locations);
      
      if (!locations || locations.length === 0) {
        console.log("No locations found for user");
        setUserLocations([]);
        setSelectedLocation(null);
        setLocationCabins([]);
        return;
      }
      
      // Transform to match Location interface
      const formattedLocations: Location[] = locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        zipCode: loc.zip_code,
        cabinsCount: loc.cabins_count || 0,
        openingHours: (loc.opening_hours as unknown as { open: string; close: string }) || { open: "09:00", close: "18:00" },
        amenities: loc.amenities || [],
        imageUrl: loc.image_url || "",
        description: loc.description || ""
      }));
      
      setUserLocations(formattedLocations);
      
      // Set default selected location if there are any
      if (formattedLocations.length > 0) {
        setSelectedLocation(formattedLocations[0]);
        
        // Load cabins for selected location
        await loadLocationCabins(formattedLocations[0].id);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Erro ao carregar locais");
    }
  };
  
  const loadLocationCabins = async (locationId: string) => {
    try {
      console.log("Loading cabins for location:", locationId);
      
      const { data: cabins, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('location_id', locationId);
      
      if (error) {
        throw error;
      }
      
      console.log("Loaded cabins:", cabins);
      
      // Transform to match Cabin interface
      const formattedCabins: Cabin[] = cabins ? cabins.map(cabin => ({
        id: cabin.id,
        locationId: cabin.location_id,
        name: cabin.name,
        description: cabin.description || "",
        equipment: cabin.equipment || [],
        imageUrl: cabin.image_url || "",
        availability: (cabin.availability as unknown as { morning: boolean; afternoon: boolean; evening: boolean }) || {
          morning: true,
          afternoon: true,
          evening: true
        },
        pricing: {
          defaultPricing: ((cabin.pricing as unknown as { defaultPricing: any })?.defaultPricing) || {},
          specificDates: ((cabin.pricing as unknown as { specificDates: any })?.specificDates) || {}
        }
      })) : [];
      
      setLocationCabins(formattedCabins);
    } catch (error) {
      console.error("Error loading cabins:", error);
      toast.error("Erro ao carregar cabines");
    }
  };

  const handleLocationChange = async (locationId: string) => {
    console.log("Changing location to:", locationId);
    const location = userLocations.find((loc) => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      await loadLocationCabins(locationId);
    }
  };
  
  const handleLocationCreated = async (location: Location) => {
    console.log("Location created:", location);
    
    // Reload locations to get the fresh data
    if (currentUser) {
      await loadUserLocations(currentUser.id);
      toast.success(`${location.name} foi adicionado à sua lista de locais.`);
    }
  };
  
  const handleCabinAdded = async (cabin: Cabin) => {
    console.log("Cabin added:", cabin);
    
    // Reload cabins to get fresh data
    if (selectedLocation) {
      await loadLocationCabins(selectedLocation.id);
    }
  };
  
  const handleCabinUpdated = async (updatedCabin: Cabin) => {
    console.log("Cabin updated:", updatedCabin);
    
    // Reload cabins to get fresh data
    if (selectedLocation) {
      await loadLocationCabins(selectedLocation.id);
    }
  };
  
  const handleCabinDeleted = async (cabinId: string) => {
    try {
      console.log("Deleting cabin:", cabinId);
      
      const { error } = await supabase
        .from('cabins')
        .delete()
        .eq('id', cabinId);
      
      if (error) {
        throw error;
      }
      
      // Reload cabins to get fresh data
      if (selectedLocation) {
        await loadLocationCabins(selectedLocation.id);
      }
      
    } catch (error) {
      console.error("Error deleting cabin:", error);
      toast.error("Erro ao excluir cabine");
    }
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
        </div>
      </div>
    );
  }

  if (authChecked && !currentUser) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-bold mb-4">Erro de autenticação</h1>
        <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
          onClick={() => navigate("/login")}
        >
          Ir para página de login
        </button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Portal do Franqueado</h1>
      <p className="text-muted-foreground mb-8">
        Gerencie seus locais, cabines e preços
      </p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <OwnerSidebar 
          userLocations={userLocations}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          onLocationCreated={handleLocationCreated}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "locations" && (
            <>
              <LocationsOverview selectedLocation={selectedLocation} locationCabins={locationCabins} />
              <div className="mt-6">
                <CabinManagement
                  selectedLocation={selectedLocation}
                  locationCabins={locationCabins}
                  onCabinAdded={handleCabinAdded}
                  onCabinUpdated={handleCabinUpdated}
                  onCabinDeleted={handleCabinDeleted}
                />
              </div>
            </>
          )}

          {activeTab === "pricing" && (
            <PricingSettings selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}
          
          {activeTab === "equipment" && (
            <EquipmentSettings selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}

          {activeTab === "availability" && (
            <AvailabilitySettings selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}

          {activeTab === "settings" && (
            <LocationSettings selectedLocation={selectedLocation} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
