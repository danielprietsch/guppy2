
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

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
          .select('name, user_type')
          .eq('id', session.user.id)
          .single();
          
        if (error || !profile) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar seu perfil.",
            variant: "destructive",
          });
          return;
        }
          
        // Check if user is client type
        if (profile.user_type !== "client") {
          toast({
            title: "Acesso negado",
            description: "Esta página é apenas para clientes.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        setUserName(profile.name || session.user.email?.split('@')[0] || "Cliente");
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar autenticação",
          variant: "destructive",
        });
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
