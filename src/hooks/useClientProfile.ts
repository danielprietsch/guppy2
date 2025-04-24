import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugAreaLog, debugAreaCritical } from "@/utils/debugLogger";

export const useClientProfile = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    debugAreaLog("CLIENT_PROFILE", "Initializing useClientProfile hook");
    
    const checkAuthStatus = async () => {
      setIsLoading(true);
      setError(undefined);
      
      try {
        debugAreaLog("CLIENT_PROFILE", "Checking auth status");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error(`Erro ao buscar sessão: ${sessionError.message}`);
        }
        
        if (!session) {
          debugAreaCritical("CLIENT_PROFILE", "No session found, redirecting to login");
          setError("Você precisa fazer login para acessar esta página.");
          toast({
            title: "Não autenticado",
            description: "Você precisa fazer login para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        debugAreaLog("CLIENT_PROFILE", "Session found, checking user type");
        
        // First priority: use user metadata (most reliable)
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        debugAreaLog("CLIENT_PROFILE", "User metadata:", userMetadata);
        
        // Client profile should only be accessible to clients
        if (userTypeFromMetadata === 'client') {
          debugAreaLog("CLIENT_PROFILE", "User is client according to metadata");
          
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            userType: 'client',
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: userMetadata?.phone_number || null
          };
          
          debugAreaLog("CLIENT_PROFILE", "Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // If metadata doesn't confirm status, use the profiles table
        try {
          debugAreaLog("CLIENT_PROFILE", "Fetching profile from database");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            debugAreaCritical("CLIENT_PROFILE", "Error fetching profile:", profileError);
            throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
          }
          
          if (!profile) {
            debugAreaCritical("CLIENT_PROFILE", "Profile not found");
            throw new Error("Perfil não encontrado no banco de dados.");
          }
          
          debugAreaLog("CLIENT_PROFILE", "Profile data:", profile);
          
          if (!profile.user_type) {
            debugAreaCritical("CLIENT_PROFILE", "User type not defined in profile");
            throw new Error("Tipo de usuário não definido no perfil.");
          }
          
          if (profile.user_type !== 'client') {
            debugAreaCritical("CLIENT_PROFILE", "User is not a client", profile.user_type);
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
          
          debugAreaLog("CLIENT_PROFILE", "Setting currentUser from database:", userData);
          setCurrentUser(userData);
        } catch (error: any) {
          debugAreaCritical("CLIENT_PROFILE", "Error in profile verification:", error);
          setError(error.message || "Ocorreu um erro ao verificar seu perfil.");
          toast({
            title: "Erro",
            description: error.message || "Ocorreu um erro ao verificar seu perfil.",
            variant: "destructive",
          });
          // Only redirect to login if it's an authentication error
          if (error.message?.includes("autenticação")) {
            navigate("/login");
          }
        }
      } catch (error: any) {
        debugAreaCritical("CLIENT_PROFILE", "Error checking auth status:", error);
        setError(error.message || "Ocorreu um erro ao verificar sua autenticação.");
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao verificar sua autenticação.",
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugAreaLog("CLIENT_PROFILE", "Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        debugAreaLog("CLIENT_PROFILE", "User signed out, redirecting to login");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Re-verify profile on login
        debugAreaLog("CLIENT_PROFILE", "User signed in, checking auth status");
        // Using setTimeout to avoid deadlocks with Supabase auth state changes
        setTimeout(() => {
          checkAuthStatus();
        }, 0);
      }
    });
    
    checkAuthStatus();
    
    return () => {
      debugAreaLog("CLIENT_PROFILE", "Cleaning up");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!currentUser) {
        throw new Error("Nenhum usuário está logado no momento");
      }

      debugAreaLog("CLIENT_PROFILE", "Updating profile with data:", data);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email,
          phone_number: data.phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);
        
      if (error) {
        debugAreaCritical("CLIENT_PROFILE", "Error updating profile:", error);
        throw new Error(`Erro ao atualizar perfil: ${error.message}`);
      }
      
      // Also update user metadata to keep things in sync
      try {
        await supabase.auth.updateUser({
          data: {
            name: data.name,
            phone_number: data.phoneNumber
          }
        });
      } catch (metadataError) {
        debugAreaCritical("CLIENT_PROFILE", "Error updating user metadata:", metadataError);
        // Continue anyway since the profile was updated successfully
      }
      
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      
      debugAreaLog("CLIENT_PROFILE", "Profile updated successfully");
      return { success: true };
    } catch (error: any) {
      debugAreaCritical("CLIENT_PROFILE", "Error updating profile:", error);
      return { success: false, error: error.message || "Erro desconhecido ao atualizar perfil" };
    }
  };

  return { currentUser, isLoading, error, setCurrentUser, updateProfile };
};
