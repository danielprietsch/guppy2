
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
        
        // If metadata confirms owner type, create user from metadata
        if (userTypeFromMetadata === 'owner') {
          debugLog("useOwnerProfile: User is owner according to metadata");
          
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: "owner",
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: null
          };
          
          debugLog("useOwnerProfile: Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // If metadata doesn't confirm owner status, try using the get_profile_user_type function
        // This function is SECURITY DEFINER and avoids the RLS recursion
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
          
          // Check if user type confirms owner status
          if (userType !== "owner") {
            toast({
              title: "Acesso restrito",
              description: "Você não tem permissão para acessar esta página.",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          // User type confirms owner status, create basic user data
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: "owner",
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
    
    // Set up listener for authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog("useOwnerProfile: Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        debugLog("useOwnerProfile: User signed out, redirecting to login");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN") {
        // Re-verify profile on login
        debugLog("useOwnerProfile: User signed in, checking auth status");
        // Small timeout to avoid race conditions
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
