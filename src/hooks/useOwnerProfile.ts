
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
        
        // If metadata doesn't confirm owner status, try a direct auth verification approach
        debugLog("useOwnerProfile: Not confirmed as owner by metadata, checking other sources");
        
        try {
          // Try to use a direct auth approach to confirm ownership
          // Option 1: Check if user has any locations (only owners have locations)
          const { data: ownerLocations, error: locationsError } = await supabase
            .from('locations')
            .select('id')
            .eq('owner_id', session.user.id)
            .limit(1);
            
          if (!locationsError && ownerLocations && ownerLocations.length > 0) {
            debugLog("useOwnerProfile: User verified as owner via locations table");
            
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
            return;
          }
          
          debugLog("useOwnerProfile: Could not verify as owner via locations, trying direct auth check");
          
          // Option 2: As a last resort, try using a direct profile check with typecast
          // Get user type directly with a very minimal query that avoids RLS recursion
          const { data: userType, error: userTypeError } = await supabase
            .rpc('get_profile_user_type', { user_id: session.user.id });
            
          if (userTypeError) {
            debugError("useOwnerProfile: Error checking user type:", userTypeError);
            
            // If user metadata exists but doesn't indicate owner, redirect
            if (userTypeFromMetadata && userTypeFromMetadata !== 'owner') {
              toast({
                title: "Acesso restrito",
                description: "Você não tem permissão para acessar esta página.",
                variant: "destructive",
              });
              navigate("/");
              return;
            }
            
            // If we can't determine user type at all, default to assume they're not an owner
            toast({
              title: "Acesso restrito",
              description: "Não foi possível verificar suas permissões.",
              variant: "destructive",
            });
            navigate("/");
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
