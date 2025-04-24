
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userLocations, setUserLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

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

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, user_type')
          .eq('id', session.user.id)
          .single();
          
        if (error || !profile) {
          debugError("ClientDashboardPage: Error fetching profile:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seu perfil.",
            variant: "destructive",
          });
          return;
        }
          
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
        debugLog(`ClientDashboardPage: Setting username to ${name}`);
        setUserName(name);

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
          admin_approvals (
            id,
            status
          )
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

  const handleRequestApproval = async (locationId: string) => {
    try {
      // Check if there's already an approval request
      const { data: existingApproval, error: checkError } = await supabase
        .from('admin_approvals')
        .select('id, status')
        .eq('location_id', locationId)
        .maybeSingle();
        
      if (checkError) {
        debugError("ClientDashboardPage: Error checking existing approval:", checkError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar solicitações existentes.",
          variant: "destructive",
        });
        return;
      }
      
      // If there's an existing approved request, don't create a new one
      if (existingApproval?.status === "APROVADO") {
        toast({
          title: "Aviso",
          description: "Este local já foi aprovado.",
        });
        return;
      }
      
      // If there's a pending request, don't create a new one
      if (existingApproval?.status === "PENDENTE") {
        toast({
          title: "Aviso",
          description: "Já existe uma solicitação de aprovação pendente para este local.",
        });
        return;
      }
      
      // Create a new approval request
      const { error } = await supabase
        .from('admin_approvals')
        .insert({
          location_id: locationId,
          status: "PENDENTE"
        });
        
      if (error) {
        debugError("ClientDashboardPage: Error creating approval request:", error);
        toast({
          title: "Erro",
          description: "Não foi possível solicitar a aprovação do local.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Sucesso",
        description: "Solicitação de aprovação enviada com sucesso.",
      });
      
      // Refresh locations
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserLocations(session.user.id);
      }
      
    } catch (error) {
      debugError("ClientDashboardPage: Error in handleRequestApproval:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao solicitar a aprovação.",
        variant: "destructive",
      });
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
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {userName}</h1>
          <p className="mt-1 text-gray-500">
            Bem-vindo ao seu painel de cliente
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dashboard do Cliente</h2>
        <p className="text-muted-foreground mb-6">
          Esta é a página do painel do cliente.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium text-lg mb-2">Minhas Reservas</h3>
            <p className="text-gray-500">Veja suas reservas e agendamentos.</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium text-lg mb-2">Descobrir Profissionais</h3>
            <p className="text-gray-500">Encontre profissionais disponíveis.</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="font-medium text-lg mb-2">Meu Perfil</h3>
            <p className="text-gray-500">Atualize suas informações pessoais.</p>
          </div>
        </div>
        
        {userLocations.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-semibold mb-4">Meus Locais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userLocations.map((location) => {
                const approvalStatus = location.admin_approvals?.[0]?.status;
                const isApproved = location.active || approvalStatus === "APROVADO";
                const hasPendingRequest = approvalStatus === "PENDENTE";
                
                return (
                  <Card key={location.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="font-medium text-lg mb-2">{location.name}</h3>
                      <div className="flex items-center mb-4">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isApproved ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        <span className="text-sm">{isApproved ? 'Aprovado' : 'Aguardando Aprovação'}</span>
                      </div>
                      
                      {!isApproved && !hasPendingRequest && (
                        <Button 
                          onClick={() => handleRequestApproval(location.id)}
                          className="w-full mt-2"
                        >
                          Solicitar Aprovação
                        </Button>
                      )}
                      
                      {hasPendingRequest && (
                        <Button 
                          disabled
                          variant="outline"
                          className="w-full mt-2"
                        >
                          Solicitação Pendente
                        </Button>
                      )}
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
