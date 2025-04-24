
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { GlobalAdminProfileForm } from "@/components/admin/GlobalAdminProfileForm";
import { debugLog, debugError } from "@/utils/debugLogger";

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
          
          // Get or create profile data
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (error) {
            debugError("GlobalAdminProfilePage: Error fetching profile:", error);
          }
          
          const userData: User = {
            id: session.user.id,
            name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
            email: profile?.email || session.user.email || "",
            userType: "global_admin",
            avatarUrl: profile?.avatar_url || session.user.user_metadata?.avatar_url,
            phoneNumber: profile?.phone_number
          };
          
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }

        // If not in metadata, check profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name, user_type, email, phone_number, avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          debugError("GlobalAdminProfilePage: Error fetching profile:", error);
          toast({
            title: "Erro ao carregar perfil",
            description: "Não foi possível verificar suas credenciais.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
          
        if (!profile || profile.user_type !== "global_admin") {
          debugLog("GlobalAdminProfilePage: Non-admin user attempting to access:", profile?.user_type);
          toast({
            title: "Acesso negado",
            description: "Esta página é apenas para administradores globais.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        const userData: User = {
          id: session.user.id,
          name: profile.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Administrador",
          email: profile.email || session.user.email || "",
          userType: "global_admin",
          avatarUrl: profile.avatar_url,
          phoneNumber: profile.phone_number
        };
        
        setCurrentUser(userData);
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

      <div className="max-w-2xl mx-auto">
        <GlobalAdminProfileForm 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
        />
      </div>
    </div>
  );
};

export default GlobalAdminProfilePage;
