
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
        
        // Verificar tipo de usuário diretamente nos metadados - mais confiável
        const userType = session.user.user_metadata?.userType;
        if (userType === 'owner') {
          debugLog("OwnerDashboardPage: User is owner according to metadata");
          setAuthChecked(true);
          return; // Usuário é franqueado, permitir acesso
        }

        // Se não encontrarmos o tipo nos metadados, verificar no perfil como fallback
        try {
          // Tentar buscar o tipo no perfil como fonte secundária
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            // Se houver erro na consulta de perfil, mas os metadados indicam franqueado, permitir acesso
            if (userType === 'owner') {
              debugLog("OwnerDashboardPage: Error fetching profile, falling back to metadata");
              setAuthChecked(true);
              return;
            }
            
            throw error; // Re-lançar para tratamento externo
          }

          if (profile?.user_type === 'owner') {
            debugLog("OwnerDashboardPage: User is owner according to profile");
            setAuthChecked(true);
            return;
          }
          
          // Se chegou aqui, não é franqueado, redirecionar
          debugLog("OwnerDashboardPage: User is not owner, redirecting");
          toast({
            title: "Acesso Negado",
            description: "Você não tem permissão para acessar o dashboard de franqueado.",
            variant: "destructive"
          });
          navigate("/");
          
        } catch (error) {
          debugError("OwnerDashboardPage: Error in profile check:", error);
          
          // Se não podemos determinar com o perfil, mas os metadados dizem que é franqueado, permitir
          if (userType === 'owner') {
            debugLog("OwnerDashboardPage: Using metadata as fallback");
            setAuthChecked(true);
            return;
          }
          
          // Caso não possamos confirmar que é franqueado, redirecionar para segurança
          toast({
            title: "Erro",
            description: "Não foi possível verificar suas permissões.",
            variant: "destructive"
          });
          navigate("/");
        }
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
