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
          debugAreaCritical("CLIENT_PROFILE", "Session error:", sessionError);
          throw new Error(`Erro ao buscar sessão: ${sessionError.message}`);
        }
        
        if (!session) {
          debugAreaCritical("CLIENT_PROFILE", "No session found");
          setError("Você precisa fazer login para acessar esta página.");
          navigate("/login");
          return;
        }
        
        debugAreaLog("CLIENT_PROFILE", "Session found, fetching user details");
        
        // First try to get user type from metadata
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        debugAreaLog("CLIENT_PROFILE", "User metadata:", userMetadata);
        
        // If metadata indicates this is a client user, use that data
        if (userTypeFromMetadata === 'client') {
          debugAreaLog("CLIENT_PROFILE", "User is client according to metadata");
          
          const userData: User = {
            id: session.user.id,
            name: userMetadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            user_type: 'client',
            avatarUrl: userMetadata?.avatar_url,
            phoneNumber: userMetadata?.phone_number || null
          };
          
          debugAreaLog("CLIENT_PROFILE", "Setting currentUser from metadata:", userData);
          setCurrentUser(userData);
          setIsLoading(false);
          return;
        }
        
        // If metadata doesn't confirm status, check the profiles table
        debugAreaLog("CLIENT_PROFILE", "Fetching profile from database");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
          
        if (profileError) {
          debugAreaCritical("CLIENT_PROFILE", "Profile fetch error:", profileError);
          throw new Error(`Erro ao buscar perfil: ${profileError.message}`);
        }
        
        if (!profile) {
          debugAreaCritical("CLIENT_PROFILE", "Profile not found in database");
          throw new Error("Perfil não encontrado no banco de dados.");
        }
        
        debugAreaLog("CLIENT_PROFILE", "Profile data retrieved:", profile);
        
        // Verify this is a client user
        if (profile.user_type !== 'client') {
          debugAreaCritical("CLIENT_PROFILE", "User is not a client:", profile.user_type);
          setError("Você não tem permissão para acessar esta página de perfil de cliente.");
          navigate("/");
          return;
        }
        
        // Build user data from profile
        const userData: User = {
          id: session.user.id,
          name: profile.name || session.user.email?.split('@')[0] || "Usuário",
          email: profile.email || session.user.email || "",
          user_type: 'client',
          avatarUrl: profile.avatar_url,
          phoneNumber: profile.phone_number
        };
        
        debugAreaLog("CLIENT_PROFILE", "Setting currentUser from database:", userData);
        setCurrentUser(userData);
      } catch (error: any) {
        debugAreaCritical("CLIENT_PROFILE", "Error in checkAuthStatus:", error);
        setError(error.message || "Ocorreu um erro ao verificar suas credenciais.");
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro ao verificar suas credenciais.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugAreaLog("CLIENT_PROFILE", "Auth state changed:", event);
      if (event === "SIGNED_OUT" || !session) {
        debugAreaLog("CLIENT_PROFILE", "User signed out, resetting state");
        setCurrentUser(null);
        navigate("/login");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Re-verify profile on login
        debugAreaLog("CLIENT_PROFILE", "User signed in, checking profile");
        // Using setTimeout to avoid deadlocks with Supabase auth state changes
        setTimeout(() => {
          checkAuthStatus();
        }, 0);
      }
    });
    
    checkAuthStatus();
    
    return () => {
      debugAreaLog("CLIENT_PROFILE", "Cleaning up useClientProfile");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (!currentUser) {
        throw new Error("Nenhum usuário está logado no momento");
      }
      
      debugAreaLog("CLIENT_PROFILE", "Updating profile with data:", data);
      
      // Prepare update data, handling optional fields
      const updateData: any = {};
      
      // Only include fields that were provided
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phoneNumber !== undefined) updateData.phone_number = data.phoneNumber;
      
      // Always set updated_at
      updateData.updated_at = new Date().toISOString();
      
      // Only update avatar if provided
      if (data.avatarUrl !== undefined) {
        debugAreaLog("CLIENT_PROFILE", "Avatar URL included in update:", data.avatarUrl);
        
        // Use the security definer function for avatar updates if only updating the avatar
        if (Object.keys(data).length === 1 && data.avatarUrl) {
          const { data: result, error: avatarError } = await supabase.rpc(
            'update_avatar_everywhere',
            { user_id: currentUser.id, avatar_url: data.avatarUrl }
          );
          
          if (avatarError) {
            debugAreaCritical("CLIENT_PROFILE", "Error in update_avatar_everywhere:", avatarError);
            throw new Error(`Erro ao atualizar avatar: ${avatarError.message}`);
          }
          
          // Update local state with new avatar
          setCurrentUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
          
          debugAreaLog("CLIENT_PROFILE", "Avatar updated successfully via RPC function");
          
          return { success: true };
        } else {
          // If updating avatar along with other fields, include it in the profiles update
          updateData.avatar_url = data.avatarUrl;
        }
      }
      
      // Only proceed with profile update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        debugAreaLog("CLIENT_PROFILE", "Updating profile with data:", updateData);
        
        // Update the profile in the database
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', currentUser.id);
          
        if (error) {
          debugAreaCritical("CLIENT_PROFILE", "Error updating profile in database:", error);
          throw new Error(`Erro ao atualizar perfil: ${error.message}`);
        }
        
        // Also update user metadata to keep things in sync
        if (data.name || data.phoneNumber || data.avatarUrl) {
          const metadataUpdate: any = {};
          if (data.name) metadataUpdate.name = data.name;
          if (data.phoneNumber) metadataUpdate.phone_number = data.phoneNumber;
          if (data.avatarUrl) metadataUpdate.avatar_url = data.avatarUrl;
          
          const { error: metadataError } = await supabase.auth.updateUser({
            data: metadataUpdate
          });
          
          if (metadataError) {
            debugAreaCritical("CLIENT_PROFILE", "Error updating user metadata:", metadataError);
            // Don't fail the whole operation if metadata update fails
            console.warn("Metadata update failed but profile was updated successfully");
          }
        }
        
        // Update local state
        setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      }
      
      debugAreaLog("CLIENT_PROFILE", "Profile successfully updated");
      
      return { success: true };
    } catch (error: any) {
      debugAreaCritical("CLIENT_PROFILE", "Error in updateProfile:", error);
      return { 
        success: false, 
        error: error.message || "Erro desconhecido ao atualizar perfil" 
      };
    }
  };

  return { currentUser, isLoading, error, updateProfile };
};
