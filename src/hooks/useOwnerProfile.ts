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
  const [error, setError] = useState<string | undefined>(undefined);

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
        
        // Prioridade: usar metadados do usuário (mais confiável)
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
            userType: userTypeFromMetadata === 'owner' ? 'owner' : 'global_admin',
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: null
          };
          
          debugLog("useOwnerProfile: Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // Se metadados não confirmarem status, usar RPC function do supabase que evita recursão
        try {
          // Usar a função check_owner_status que evita recursão RLS
          const { data: ownerData, error: checkError } = await supabase
            .rpc('check_owner_status', { user_id: session.user.id });
            
          if (checkError) {
            debugError("useOwnerProfile: Error checking user type:", checkError);
            throw checkError;
          }
          
          if (!ownerData || ownerData.length === 0) {
            setError("Você não tem permissão para acessar esta página.");
            toast({
              title: "Acesso restrito",
              description: "Você não tem permissão para acessar esta página.",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          // Tipo de usuário confirmado como owner
          const ownerInfo = ownerData[0];
          const userData: User = {
            id: ownerInfo.id,
            name: ownerInfo.name || session.user.email?.split('@')[0] || "Usuário",
            email: ownerInfo.email || session.user.email || "",
            userType: "owner",
            avatarUrl: ownerInfo.avatar_url,
            phoneNumber: ownerInfo.phone_number
          };
          
          debugLog("useOwnerProfile: Setting currentUser from owner check:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
        } catch (error) {
          debugError("useOwnerProfile: Error in profile verification:", error);
          setError("Ocorreu um erro ao verificar seu perfil.");
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao verificar seu perfil.",
            variant: "destructive",
          });
          navigate("/login");
        }
      } catch (error) {
        debugError("useOwnerProfile: Error checking auth status:", error);
        setError("Ocorreu um erro ao verificar sua autenticação.");
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

  return { currentUser, isLoading, error, setCurrentUser };
};
