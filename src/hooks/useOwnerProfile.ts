
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
        
        // Use the RPC function to check if the user is an owner
        const { data: isOwnerData, error: ownerCheckError } = await supabase
          .rpc('check_owner_status', { user_id: session.user.id });
          
        if (ownerCheckError) {
          debugError("useOwnerProfile: Error checking owner status:", ownerCheckError);
          throw ownerCheckError;
        }
        
        if (!isOwnerData || isOwnerData.length === 0) {
          debugLog("useOwnerProfile: User is not an owner");
          setError("Você não tem permissão para acessar esta página.");
          toast({
            title: "Acesso restrito",
            description: "Você não tem permissão para acessar esta página.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        // User is confirmed as owner
        const ownerData = isOwnerData[0];
        const userData: User = {
          id: ownerData.id,
          name: ownerData.name || session.user.email?.split('@')[0] || "Usuário",
          email: ownerData.email || session.user.email || "",
          userType: "owner",
          avatarUrl: ownerData.avatar_url,
          phoneNumber: ownerData.phone_number
        };
        
        debugLog("useOwnerProfile: Setting currentUser from owner check:", userData);
        setCurrentUser(userData);
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
    
    // Setup listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        checkAuthStatus();
      }
    });
    
    checkAuthStatus();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { currentUser, isLoading, error, setCurrentUser };
};
