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
        
        // Query for the profile data directly instead of using RPC
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .eq('user_type', 'owner')
          .single();
          
        if (profileError) {
          debugError("useOwnerProfile: Error checking owner status:", profileError);
          throw profileError;
        }
        
        if (!profileData) {
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
        if (profileData.user_type === "owner" || 
            profileData.user_type === "professional" || 
            profileData.user_type === "client" || 
            profileData.user_type === "global_admin") {
          userType = profileData.user_type as "owner" | "professional" | "client" | "global_admin";
        }
        
        // User is confirmed as owner
        const userData: User = {
          id: profileData.id,
          name: profileData.name || session.user.email?.split('@')[0] || "Usuário",
          email: profileData.email || session.user.email || "",
          userType: userType,
          avatarUrl: profileData.avatar_url,
          phoneNumber: profileData.phone_number
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
