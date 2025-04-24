
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { debugLog, debugError } from "@/utils/debugLogger";

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

        const userMetadata = session.user.user_metadata;
        const name = userMetadata?.name || session.user.email?.split('@')[0] || "Cliente";
        setUserName(name);
      } catch (error) {
        debugError("ClientDashboardPage: Authentication verification error:", error);
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

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {userName}</h1>
          <p className="mt-1 text-gray-500">
            Bem-vindo ao seu painel de cliente
          </p>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Dashboard do Cliente</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate("/client/reservations")}>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Minhas Reservas</h3>
              <p className="text-gray-500">Veja suas reservas e agendamentos.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate("/professionals")}>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Descobrir Profissionais</h3>
              <p className="text-gray-500">Encontre profissionais disponíveis.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow hover:shadow-md transition-all cursor-pointer" 
                onClick={() => navigate("/client/profile")}>
            <CardContent className="p-6">
              <h3 className="font-medium text-lg mb-2">Meu Perfil</h3>
              <p className="text-gray-500">Atualize suas informações pessoais.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboardPage;
