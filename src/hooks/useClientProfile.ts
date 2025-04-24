
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useClientProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    debugLog("useClientProfile: Initializing");
    
    const checkAuthStatus = async () => {
      try {
        debugLog("useClientProfile: Checking auth status");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("useClientProfile: No session found, redirecting to login");
          toast({
            title: "Não autenticado",
            description: "Você precisa fazer login para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        debugLog("useClientProfile: Session found, checking user type");
        
        // First priority: use user metadata (most reliable)
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        // Client profile should only be accessible to clients
        if (userTypeFromMetadata === 'client') {
          debugLog("useClientProfile: User is client according to metadata");
          
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: 'client',
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: userMetadata?.phone_number || null
          };
          
          debugLog("useClientProfile: Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // If metadata doesn't confirm status, use the profiles table
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            debugError("useClientProfile: Error fetching profile:", profileError);
            setError("Ocorreu um erro ao buscar seu perfil.");
            toast({
              title: "Erro",
              description: "Ocorreu um erro ao buscar seu perfil.",
              variant: "destructive",
            });
            navigate("/login");
            return;
          }
          
          if (profile.user_type !== 'client') {
            debugLog("useClientProfile: User is not a client, redirecting");
            setError("Você não tem permissão para acessar esta página.");
            toast({
              title: "Acesso restrito",
              description: "Você não tem permissão para acessar esta página.",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          const userData: User = {
            id: session.user.id,
            name: profile.name || session.user.email?.split('@')[0] || "Usuário",
            email: profile.email || session.user.email || "",
            userType: 'client',
            avatarUrl: profile.avatar_url,
            phoneNumber: profile.phone_number
          };
          
          setCurrentUser(userData);
          setIsLoading(false);
        } catch (error) {
          debugError("useClientProfile: Error in profile verification:", error);
          setError("Ocorreu um erro ao verificar seu perfil.");
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao verificar seu perfil.",
            variant: "destructive",
          });
          navigate("/login");
        }
      } catch (error) {
        debugError("useClientProfile: Error checking auth status:", error);
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
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog("useClientProfile: Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        debugLog("useClientProfile: User signed out, redirecting to login");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN") {
        // Re-verify profile on login
        debugLog("useClientProfile: User signed in, checking auth status");
        setTimeout(() => {
          checkAuthStatus();
        }, 0);
      }
    });
    
    checkAuthStatus();
    
    return () => {
      debugLog("useClientProfile: Cleaning up");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!currentUser) {
        throw new Error("No user is currently logged in");
      }

      debugLog("useClientProfile: Updating profile with data:", data);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email,
          phone_number: data.phoneNumber,
        })
        .eq('id', currentUser.id);
        
      if (error) {
        throw error;
      }
      
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      
      debugLog("useClientProfile: Profile updated successfully");
      return { success: true };
    } catch (error) {
      debugError("useClientProfile: Error updating profile:", error);
      return { success: false, error };
    }
  };

  return { currentUser, isLoading, error, setCurrentUser, updateProfile };
};
