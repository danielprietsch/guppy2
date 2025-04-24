
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { addAdminRole } from "@/utils/adminUtils";

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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

        setUserId(session.user.id);

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

        // Check for admin role
        await checkAdminRole(session.user.id);
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

  const checkAdminRole = async (userId: string) => {
    try {
      debugLog("ClientDashboardPage: Checking admin role for user", userId);
      
      // First, try to make the user an admin if they aren't already
      if (userId) {
        debugLog("ClientDashboardPage: Ensuring user has admin role");
        const adminResult = await addAdminRole(userId);
        debugLog("ClientDashboardPage: Admin role addition result:", adminResult);
      }
      
      // Now check for admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (rolesError) {
        debugError("ClientDashboardPage: Error fetching roles:", rolesError);
        return;
      }

      const hasAdminRole = roles && roles.some(r => r.role === 'admin') || false;
      debugLog(`ClientDashboardPage: User is admin: ${hasAdminRole}`);
      setIsAdmin(hasAdminRole);
    } catch (error) {
      debugError("ClientDashboardPage: Error checking admin role:", error);
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
        <button
          className="mt-4 md:mt-0 px-4 py-2 border rounded"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dashboard do Cliente</h2>
        <p className="text-muted-foreground mb-6">
          Esta é uma página de exemplo para o painel do cliente.
        </p>
        
        {isAdmin && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-medium text-lg mb-2 text-purple-800">Acesso Administrativo</h3>
            <p className="text-gray-600 mb-4">Você possui privilégios administrativos nesta plataforma.</p>
            <Link to="/admin/dashboard">
              <Button variant="secondary" className="bg-purple-600 text-white hover:bg-purple-700">
                Ver Dashboard Admin
              </Button>
            </Link>
          </div>
        )}
        
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
      </div>
    </div>
  );
};

export default ClientDashboardPage;
