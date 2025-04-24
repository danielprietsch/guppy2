
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
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmounting
    debugLog("useOwnerProfile: Initializing");
    
    const checkAuthStatus = async () => {
      try {
        debugLog("useOwnerProfile: Checking auth status");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("useOwnerProfile: No session found, redirecting to login");
          if (isMounted) {
            toast({
              title: "Não autenticado",
              description: "Você precisa fazer login para acessar esta página.",
              variant: "destructive",
            });
            navigate("/login");
          }
          return;
        }
        
        debugLog("useOwnerProfile: Session found, checking user type");
        
        // Use check_owner_status function instead of is_user_owner to avoid RLS recursion
        const { data: ownerData, error: ownerCheckError } = await supabase
          .rpc('check_owner_status', { user_id: session.user.id });
          
        if (ownerCheckError) {
          debugError("useOwnerProfile: Error checking owner status:", ownerCheckError);
          throw ownerCheckError;
        }
        
        if (!ownerData) {
          debugLog("useOwnerProfile: User is not an owner");
          if (isMounted) {
            setError("Você não tem permissão para acessar esta página.");
            toast({
              title: "Acesso restrito",
              description: "Você não tem permissão para acessar esta página.",
              variant: "destructive",
            });
            navigate("/");
          }
          return;
        }
        
        // Fix type issue: ensure userType is one of the allowed values
        let userType: "owner" | "professional" | "client" | "global_admin" = "owner"; // Default to owner
        
        // Check if the profile data contains a valid user_type
        if (ownerData.user_type === "owner" || 
            ownerData.user_type === "professional" || 
            ownerData.user_type === "client" || 
            ownerData.user_type === "global_admin") {
          userType = ownerData.user_type as "owner" | "professional" | "client" | "global_admin";
        }
        
        // User is confirmed as owner
        const userData: User = {
          id: ownerData.id,
          name: ownerData.name || session.user.email?.split('@')[0] || "Usuário",
          email: ownerData.email || session.user.email || "",
          userType: userType,
          avatarUrl: ownerData.avatar_url,
          phoneNumber: ownerData.phone_number
        };
        
        if (isMounted) {
          debugLog("useOwnerProfile: Setting currentUser from profile check:", userData);
          setCurrentUser(userData);
          setIsAuthChecked(true);
        }
      } catch (error) {
        debugError("useOwnerProfile: Error checking auth status:", error);
        if (isMounted) {
          setError("Ocorreu um erro ao verificar sua autenticação.");
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao verificar sua autenticação.",
            variant: "destructive",
          });
          navigate("/login");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    // Setup listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        if (isMounted) {
          setCurrentUser(null);
          navigate("/login");
        }
      } else if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && isMounted) {
        // Use setTimeout to avoid potential deadlocks with Supabase auth
        setTimeout(() => {
          if (isMounted) checkAuthStatus();
        }, 0);
      }
    });
    
    checkAuthStatus();
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { currentUser, isLoading, error, isAuthChecked, setCurrentUser };
};
