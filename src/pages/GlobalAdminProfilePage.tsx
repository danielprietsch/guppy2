
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GlobalAdminProfileForm } from "@/components/admin/GlobalAdminProfileForm";
import { debugLog, debugError } from "@/utils/debugLogger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const GlobalAdminProfilePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        debugLog("GlobalAdminProfilePage: Checking authentication");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("GlobalAdminProfilePage: No active session");
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        debugLog("GlobalAdminProfilePage: Session found, checking if user is admin");
        
        // First check user metadata for global_admin
        const userTypeFromMetadata = session.user.user_metadata?.userType;
        debugLog("GlobalAdminProfilePage: User type from metadata:", userTypeFromMetadata);
        
        if (userTypeFromMetadata === "global_admin") {
          debugLog("GlobalAdminProfilePage: User is global_admin according to metadata");
          
          // Não tentar buscar o perfil da tabela, apenas usar os metadados
          // para evitar problemas com RLS
          const userData: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
            email: session.user.email || "",
            userType: "global_admin",
            avatarUrl: session.user.user_metadata?.avatar_url,
            phoneNumber: session.user.user_metadata?.phone_number
          };
          
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }

        // Tentativa de verificar via função RPC (contornando RLS)
        try {
          const { data: isAdmin, error: adminCheckError } = await supabase
            .rpc('is_global_admin', { user_id: session.user.id });
            
          if (adminCheckError) {
            throw adminCheckError;
          }
          
          if (!isAdmin) {
            debugLog("GlobalAdminProfilePage: User is not an admin");
            toast({
              title: "Acesso negado",
              description: "Esta página é apenas para administradores globais.",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          // Usuário é admin, criar objeto de usuário a partir dos metadados da sessão
          const userData: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
            email: session.user.email || "",
            userType: "global_admin",
            avatarUrl: session.user.user_metadata?.avatar_url,
            phoneNumber: session.user.user_metadata?.phone_number
          };
          
          setCurrentUser(userData);
        } catch (error) {
          debugError("GlobalAdminProfilePage: Error checking admin status:", error);
          toast({
            title: "Erro ao verificar permissões",
            description: "Não foi possível verificar suas credenciais.",
            variant: "destructive",
          });
          navigate("/login");
        }
      } catch (error) {
        debugError("GlobalAdminProfilePage: Authentication error:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Verificando suas credenciais...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Atualize suas informações de administrador global
      </p>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
          <CardDescription>
            Estas informações estarão visíveis para outros usuários do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlobalAdminProfileForm 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalAdminProfilePage;
