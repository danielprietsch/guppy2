import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { useLocationManagement } from "@/hooks/useLocationManagement";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { DashboardContent } from "@/components/owner/DashboardContent";
import { OwnerAddLocationModal } from "@/components/owner/OwnerAddLocationModal";
import { AddCabinModal } from "@/components/owner/AddCabinModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useOwnerProfile();
  const {
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
  } = useLocationManagement();

  const [activeTab, setActiveTab] = useState("locations");
  const [addLocationModalOpen, setAddLocationModalOpen] = useState(false);
  const [addCabinModalOpen, setAddCabinModalOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        debugLog("OwnerDashboardPage: Checking session...");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          debugLog("OwnerDashboardPage: No session found, redirecting to login");
          toast({
            title: "Acesso Negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive"
          });
          navigate("/login");
          return;
        }
        
        debugLog("OwnerDashboardPage: Session found, user:", session.user);
        
        // Verificar se o usuário é um franqueado diretamente nos metadados
        const userType = session.user.user_metadata?.userType;
        
        // Permitir tanto 'owner' quanto 'global_admin'
        if (userType === 'owner' || userType === 'global_admin') {
          debugLog("OwnerDashboardPage: User is authorized according to metadata");
          setAuthChecked(true);
          return;
        }

        // Se não for um tipo de usuário válido nos metadados, redirecionar
        debugLog("OwnerDashboardPage: User is not authorized, redirecting");
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar o dashboard de franqueado.",
          variant: "destructive"
        });
        navigate("/");
      } catch (error) {
        debugError("OwnerDashboardPage: Error checking session:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar sua sessão.",
          variant: "destructive"
        });
        navigate("/login");
      }
    };

    checkSession();
  }, [navigate]);

  // Carregar locais quando o usuário estiver disponível
  useEffect(() => {
    if (currentUser?.id && authChecked) {
      debugLog("OwnerDashboardPage: Loading locations for user:", currentUser.id);
      loadUserLocations(currentUser.id);
    }
  }, [currentUser, loadUserLocations, authChecked]);

  if (isLoading || !authChecked) {
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
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
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
          onLocationDeleted={handleLocationDeleted}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <div className="space-y-6">
          <DashboardContent 
            selectedLocation={selectedLocation}
            userLocations={userLocations}
            locationCabins={locationCabins}
            activeTab={activeTab}
            onAddLocation={() => setAddLocationModalOpen(true)}
            onAddCabin={() => setAddCabinModalOpen(true)}
            onCabinAdded={handleCabinAdded}
            onCabinUpdated={handleCabinUpdated}
            onCabinDeleted={handleCabinDeleted}
          />
        </div>
      </div>
      
      <OwnerAddLocationModal
        open={addLocationModalOpen}
        onOpenChange={setAddLocationModalOpen}
        onLocationCreated={handleLocationCreated}
      />

      {selectedLocation && (
        <AddCabinModal
          open={addCabinModalOpen}
          onOpenChange={setAddCabinModalOpen}
          locationId={selectedLocation.id}
          onCabinCreated={handleCabinAdded}
        />
      )}
    </div>
  );
};

export default OwnerDashboardPage;
