
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Location } from "@/lib/types";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTab, setActiveTab] = useState("locations");

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

        // Get user profile
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
          
        // Check if user is owner type
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
        
        // Fetch user locations
        const { data: locations, error: locationsError } = await supabase
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
        } else {
          setUserLocations(locations || []);
          if (locations && locations.length > 0) {
            setSelectedLocation(locations[0]);
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

  const handleLocationChange = (locationId: string) => {
    const location = userLocations.find(loc => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleLocationCreated = (location: Location) => {
    setUserLocations(prev => [...prev, location]);
    setSelectedLocation(location);
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

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        <OwnerSidebar
          userLocations={userLocations}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          onLocationCreated={handleLocationCreated}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <div className="space-y-6">
          {!selectedLocation && userLocations.length === 0 ? (
            <div className="bg-muted p-6 rounded-lg text-center">
              <h3 className="font-medium text-lg mb-2">Bem-vindo ao seu Dashboard</h3>
              <p className="text-muted-foreground mb-4">
                Para começar, crie seu primeiro local usando o seletor à esquerda.
              </p>
            </div>
          ) : (
            <>
              {activeTab === "locations" && selectedLocation && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    Detalhes do Local: {selectedLocation.name}
                  </h2>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <p><strong>Endereço:</strong> {selectedLocation.address}</p>
                    <p><strong>Cidade:</strong> {selectedLocation.city}</p>
                    <p><strong>Estado:</strong> {selectedLocation.state}</p>
                    <p><strong>CEP:</strong> {selectedLocation.zip_code}</p>
                    {selectedLocation.description && (
                      <p className="mt-2"><strong>Descrição:</strong> {selectedLocation.description}</p>
                    )}
                  </div>
                </div>
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
              
              {activeTab === "settings" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Configurações</h2>
                  <p className="text-muted-foreground">Gerencie as configurações do local.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
