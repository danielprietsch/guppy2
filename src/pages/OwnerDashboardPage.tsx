
import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { currentUser, isLoading: userLoading } = useOwnerProfile();
  const {
    userLocations,
    selectedLocation,
    locationCabins,
    isLoading: locationsLoading,
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

  // Verificação de sessão executada apenas uma vez ao montar o componente
  useEffect(() => {
    const checkSession = async () => {
      try {
        debugLog("OwnerDashboardPage: Verificando sessão...");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          debugLog("OwnerDashboardPage: Sessão não encontrada, redirecionando para login");
          toast({
            title: "Acesso Negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive"
          });
          navigate("/login");
          return;
        }
        
        debugLog("OwnerDashboardPage: Sessão encontrada, usuário:", session.user);
        
        // Simplificar verificação de tipo de usuário - aceitar owner ou global_admin
        const userType = session.user.user_metadata?.userType;
        
        if (userType === 'owner' || userType === 'global_admin') {
          debugLog("OwnerDashboardPage: Usuário autorizado de acordo com os metadados");
          setAuthChecked(true);
          return;
        }

        // Redirecionar usuários não autorizados
        debugLog("OwnerDashboardPage: Usuário não autorizado, redirecionando");
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para acessar o dashboard de franqueado.",
          variant: "destructive"
        });
        navigate("/");
      } catch (error) {
        debugError("OwnerDashboardPage: Erro ao verificar sessão:", error);
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

  // Uso do useCallback para evitar recriações desnecessárias da função
  const loadLocations = useCallback(() => {
    if (currentUser?.id && authChecked) {
      debugLog("OwnerDashboardPage: Carregando locais para o usuário:", currentUser.id);
      loadUserLocations(currentUser.id);
    }
  }, [currentUser, authChecked, loadUserLocations]);

  // Carregar locais quando o usuário estiver disponível
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);
  
  // Usar useMemo para calcular estados derivados
  const isLoading = useMemo(() => 
    userLoading || locationsLoading || !authChecked, 
    [userLoading, locationsLoading, authChecked]
  );

  // Handler para abertura do modal de adicionar cabine
  const handleAddCabinClick = useCallback(() => {
    setAddCabinModalOpen(true);
  }, []);

  // Handler para abertura do modal de adicionar local
  const handleAddLocationClick = useCallback(() => {
    setAddLocationModalOpen(true);
  }, []);

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
            onAddLocation={handleAddLocationClick}
            onAddCabin={handleAddCabinClick}
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
