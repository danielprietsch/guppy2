
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";

const GlobalAdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        debugLog("GlobalAdminDashboardPage: Checking authentication");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("GlobalAdminDashboardPage: No active session");
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        debugLog("GlobalAdminDashboardPage: Session found, checking if user is admin");
        
        // First check user metadata for global_admin
        const userTypeFromMetadata = session.user.user_metadata?.userType;
        debugLog("GlobalAdminDashboardPage: User type from metadata:", userTypeFromMetadata);
        
        if (userTypeFromMetadata === "global_admin") {
          debugLog("GlobalAdminDashboardPage: User is global_admin according to metadata");
          setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador");
          setLoading(false);
          return;
        }

        // If not in metadata, check profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, user_type')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          debugError("GlobalAdminDashboardPage: Error fetching profile:", error);
          
          // Double check metadata again before rejecting
          if (userTypeFromMetadata === "global_admin") {
            debugLog("GlobalAdminDashboardPage: User appears to be global_admin despite profile error");
            setUserName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador");
            setLoading(false);
            return;
          }
          
          toast({
            title: "Erro ao carregar perfil",
            description: "Não foi possível verificar suas credenciais.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
          
        if (!profile || profile.user_type !== "global_admin") {
          debugLog("GlobalAdminDashboardPage: Non-admin user attempting to access:", profile?.user_type);
          toast({
            title: "Acesso negado",
            description: "Esta página é apenas para administradores globais.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setUserName(profile.name || session.user.email?.split('@')[0] || "Administrador");
      } catch (error) {
        debugError("GlobalAdminDashboardPage: Authentication error:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

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
          <p className="text-muted-foreground">Verificando suas credenciais...</p>
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
            Painel do Administrador Global
          </p>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="mt-4 md:mt-0"
        >
          Sair
        </Button>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dashboard do Administrador</h2>
        <p className="text-muted-foreground mb-6">
          Aqui você pode gerenciar todos os aspectos do sistema.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card shadow rounded-lg p-6">
            <h3 className="font-medium text-lg mb-2">Usuários</h3>
            <p className="text-muted-foreground">Gerenciar usuários e permissões.</p>
          </div>
          
          <div className="bg-card shadow rounded-lg p-6">
            <h3 className="font-medium text-lg mb-2">Configurações</h3>
            <p className="text-muted-foreground">Configurações do sistema.</p>
          </div>
          
          <div className="bg-card shadow rounded-lg p-6">
            <h3 className="font-medium text-lg mb-2">Relatórios</h3>
            <p className="text-muted-foreground">Visualizar relatórios do sistema.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAdminDashboardPage;
