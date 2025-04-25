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
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
        
        const userType = session.user.user_metadata?.userType;
        
        if (userType === 'owner' || userType === 'global_admin') {
          debugLog("OwnerDashboardPage: Usuário autorizado de acordo com os metadados");
          setAuthChecked(true);
          return;
        }

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

  const loadLocations = useCallback(() => {
    if (currentUser?.id && authChecked) {
      debugLog("OwnerDashboardPage: Carregando locais para o usuário:", currentUser.id);
      loadUserLocations(currentUser.id);
    }
  }, [currentUser, authChecked, loadUserLocations]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);
  
  const isLoading = useMemo(() => 
    userLoading || locationsLoading || !authChecked, 
    [userLoading, locationsLoading, authChecked]
  );

  const handleAddCabinClick = useCallback(() => {
    setAddCabinModalOpen(true);
  }, []);

  const handleAddLocationClick = useCallback(() => {
    setAddLocationModalOpen(true);
  }, []);

  const handleLogout = async () => {
    try {
      debugLog("OwnerDashboardPage: Realizando logout...");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        debugError("OwnerDashboardPage: Erro no logout:", error);
        toast({
          title: "Erro ao sair",
          description: "Não foi possível desconectar. Tente novamente.",
          variant: "destructive"
        });
        return;
      }
      
      debugLog("OwnerDashboardPage: Logout bem-sucedido, redirecionando...");
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
      
      window.location.href = "/login";
    } catch (error) {
      debugError("OwnerDashboardPage: Exceção no logout:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
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
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Franqueado</h1>
          <p className="text-muted-foreground">
            Gerencie seus locais, cabines e equipamentos
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0 flex items-center"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </Button>
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
