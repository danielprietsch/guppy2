
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError, debugAreaLog, debugAreaCritical } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { triggerApprovalRequest } from "@/utils/triggerApprovalRequest";

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [processingLocationId, setProcessingLocationId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        debugLog("ClientDashboardPage: Checking authentication");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("ClientDashboardPage: No active session");
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Get user information from session metadata first
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        debugLog("ClientDashboardPage: User metadata:", userMetadata);
        
        // If metadata indicates this is a client user, use that data
        if (userTypeFromMetadata === 'client') {
          debugLog("ClientDashboardPage: User is client according to metadata");
          
          // Use name from metadata or fallback to email
          const name = userMetadata?.name || session.user.email?.split('@')[0] || "Cliente";
          debugLog(`ClientDashboardPage: Setting username to ${name} from metadata`);
          setUserName(name);
          
          // Fetch user's locations
          await fetchUserLocations(session.user.id);
          return;
        }

        // Only try the profile table as a fallback
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('name, user_type')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            debugError("ClientDashboardPage: Error fetching profile:", error);
            // Don't return immediately, try to use session data as fallback
          } else if (profile) {
            if (profile.user_type !== "client") {
              debugLog("ClientDashboardPage: Non-client user attempting to access client dashboard");
              toast({
                title: "Acesso negado",
                description: "Esta página é apenas para clientes.",
                variant: "destructive",
              });
              navigate("/");
              return;
            }
            
            const name = profile.name || session.user.email?.split('@')[0] || "Cliente";
            debugLog(`ClientDashboardPage: Setting username to ${name} from profile`);
            setUserName(name);
            
            // Fetch user's locations
            await fetchUserLocations(session.user.id);
            return;
          }
        } catch (profileError) {
          debugError("ClientDashboardPage: Error in profile fetch:", profileError);
          // Continue to fallback approach
        }

        // Fallback: Use email from session if all else fails
        const fallbackName = session.user.email?.split('@')[0] || "Cliente";
        debugLog(`ClientDashboardPage: Using fallback name ${fallbackName}`);
        setUserName(fallbackName);
        
        // Fetch user's locations
        await fetchUserLocations(session.user.id);

      } catch (error) {
        debugError("ClientDashboardPage: Authentication verification error:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar autenticação",
          variant: "destructive",
        });
      } finally {
        debugLog("ClientDashboardPage: Finished authentication check");
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const fetchUserLocations = async (userId: string) => {
    try {
      setLoadingLocations(true);
      
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          active,
          cabins_count
        `)
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) {
        debugError("ClientDashboardPage: Error fetching locations:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus locais.",
          variant: "destructive",
        });
        return;
      }
      
      setUserLocations(data || []);
      
    } catch (error) {
      debugError("ClientDashboardPage: Error in fetchUserLocations:", error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleToggleVisibility = async (locationId: string, cabinsCount: number) => {
    try {
      setProcessingLocationId(locationId);
      const result = await triggerApprovalRequest(locationId, cabinsCount);
      
      if (result.success) {
        // Refresh locations to get the updated status
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetchUserLocations(session.user.id);
        }
      }
    } catch (error) {
      debugError("ClientDashboardPage: Error in handleToggleVisibility:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a visibilidade do local.",
        variant: "destructive",
      });
    } finally {
      setProcessingLocationId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
        </div>
      </div>
    );
  }

  const handleNavigate = (path: string) => {
    debugLog(`ClientDashboardPage: Navigating to ${path}`);
    navigate(path);
  };

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {userName}</h1>
          <p className="mt-1 text-gray-500">
            Bem-vindo ao seu painel de cliente
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            onClick={() => navigate("/client/profile")}
            variant="outline"
          >
            Meu Perfil
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
          >
            Sair
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dashboard do Cliente</h2>
        <p className="text-muted-foreground mb-6">
          Esta é a página do painel do cliente.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow hover:shadow-md transition-all cursor-pointer" 
                onClick={() => handleNavigate("/client/reservations")}>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Minhas Reservas</h3>
              <p className="text-gray-500">Veja suas reservas e agendamentos.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow hover:shadow-md transition-all cursor-pointer" 
                onClick={() => handleNavigate("/professionals")}>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Descobrir Profissionais</h3>
              <p className="text-gray-500">Encontre profissionais disponíveis.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow hover:shadow-md transition-all cursor-pointer" 
                onClick={() => handleNavigate("/client/profile")}>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Meu Perfil</h3>
              <p className="text-gray-500">Atualize suas informações pessoais.</p>
            </CardContent>
          </Card>
        </div>
        
        {userLocations.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Meus Locais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userLocations.map((location) => {
                const isActive = location.active || false;
                const hasCabins = (location.cabins_count || 0) > 0;
                
                return (
                  <Card key={location.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="font-medium text-lg mb-2">{location.name}</h3>
                      <div className="flex items-center mb-4">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        <span className="text-sm">{isActive ? 'Visível' : 'Oculto'}</span>
                      </div>
                      
                      {!hasCabins && (
                        <div className="text-amber-500 text-sm mb-4">
                          <p>Adicione pelo menos uma cabine para tornar este local visível.</p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => handleToggleVisibility(location.id, location.cabins_count || 0)}
                        className="w-full mt-2"
                        variant={isActive ? "outline" : "default"}
                        disabled={processingLocationId === location.id || (!hasCabins && !isActive)}
                      >
                        {processingLocationId === location.id ? (
                          "Processando..."
                        ) : isActive ? (
                          "Ocultar Local"
                        ) : (
                          "Tornar Visível"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDashboardPage;
