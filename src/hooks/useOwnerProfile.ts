
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useOwnerProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    debugLog("useOwnerProfile: Initializing");
    
    const checkAuthStatus = async () => {
      try {
        debugLog("useOwnerProfile: Checking auth status");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("useOwnerProfile: No session found, redirecting to login");
          toast({
            title: "Não autenticado",
            description: "Você precisa fazer login para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        debugLog("useOwnerProfile: Session found, checking user type");
        
        // First priority: use user metadata (most reliable)
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        // Permitir tanto 'owner' quanto 'global_admin'
        const allowedUserTypes = ['owner', 'global_admin'];
        
        // Se o metadado confirmar o tipo de usuário
        if (allowedUserTypes.includes(userTypeFromMetadata)) {
          debugLog(`useOwnerProfile: User is ${userTypeFromMetadata} according to metadata`);
          
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: userTypeFromMetadata,
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: null
          };
          
          debugLog("useOwnerProfile: Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // Se metadados não confirmarem status, usar função de verificação do tipo de usuário
        try {
          const { data: userType, error: userTypeError } = await supabase
            .rpc('get_profile_user_type', { user_id: session.user.id });
            
          if (userTypeError) {
            debugError("useOwnerProfile: Error checking user type:", userTypeError);
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao verificar seu perfil.",
              variant: "destructive",
            });
            navigate("/login");
            return;
          }
          
          // Verificar se o tipo de usuário está na lista de tipos permitidos
          if (!allowedUserTypes.includes(userType)) {
            toast({
              title: "Acesso restrito",
              description: "Você não tem permissão para acessar esta página.",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          // Tipo de usuário confirma status, criar dados básicos do usuário
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: userType,
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: null
          };
          
          setCurrentUser(userData);
          setIsLoading(false);
        } catch (error) {
          debugError("useOwnerProfile: Error in profile verification:", error);
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao verificar seu perfil.",
            variant: "destructive",
          });
          navigate("/login");
        }
      } catch (error) {
        debugError("useOwnerProfile: Error checking auth status:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar sua autenticação.",
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Configurar ouvinte para alterações no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog("useOwnerProfile: Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        debugLog("useOwnerProfile: User signed out, redirecting to login");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN") {
        // Re-verificar perfil no login
        debugLog("useOwnerProfile: User signed in, checking auth status");
        setTimeout(() => {
          checkAuthStatus();
        }, 0);
      }
    });
    
    checkAuthStatus();
    
    return () => {
      debugLog("useOwnerProfile: Cleaning up");
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { currentUser, isLoading, setCurrentUser };
};
