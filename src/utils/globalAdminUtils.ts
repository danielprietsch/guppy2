
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { toast } from "@/hooks/use-toast";

export const sendPasswordResetToGlobalAdmin = async () => {
  const adminEmail = 'guppyadmin@nuvemtecnologia.com';
  
  try {
    debugLog("Sending password reset to global admin");
    
    // Explicitly specify the redirect URL to ensure it works correctly
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      adminEmail, 
      {
        redirectTo: `${window.location.origin}/reset-password`
      }
    );
    
    if (error) {
      debugError("Error sending password reset:", error);
      toast({
        title: "Erro ao redefinir senha",
        description: `Não foi possível enviar o email de redefinição: ${error.message}`,
        variant: "destructive"
      });
      return false;
    }
    
    debugLog("Password reset email sent successfully", data);
    toast({
      title: "Email de redefinição enviado",
      description: "Um link para redefinir a senha foi enviado para guppyadmin@nuvemtecnologia.com. Verifique sua caixa de entrada e spam."
    });
    
    return true;
  } catch (error) {
    debugError("Unexpected error in sendPasswordResetToGlobalAdmin:", error);
    toast({
      title: "Erro",
      description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
      variant: "destructive"
    });
    return false;
  }
};

// Alternative approach - create a new admin user if one doesn't exist
export const recreateGlobalAdmin = async () => {
  try {
    debugLog("Attempting to recreate global admin user");
    
    // First, check if the user already exists
    const { data, error: fetchError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // Remove the filter property as it's not supported in the PageParams type
    });
    
    if (fetchError) {
      debugError("Error checking if admin exists:", fetchError);
      throw fetchError;
    }
    
    // Check if admin email exists in the returned users
    const adminExists = data?.users?.some(
      user => user.email === 'guppyadmin@nuvemtecnologia.com'
    );
    
    // If user exists, try password reset
    if (adminExists) {
      return sendPasswordResetToGlobalAdmin();
    }
    
    // Create new user
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: 'guppyadmin@nuvemtecnologia.com',
      password: `Admin${Date.now().toString().slice(-6)}!`,
      options: {
        data: {
          name: 'Global Admin',
          userType: 'global_admin',
          avatar_url: `https://ui-avatars.com/api/?name=Global+Admin&background=random`
        }
      }
    });
    
    if (error) {
      debugError("Error creating global admin:", error);
      toast({
        title: "Erro ao criar admin global",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    debugLog("Global admin created successfully");
    toast({
      title: "Admin Global criado",
      description: "Um email de confirmação foi enviado para guppyadmin@nuvemtecnologia.com com instruções para acesso."
    });
    
    return true;
  } catch (error) {
    debugError("Unexpected error creating global admin:", error);
    toast({
      title: "Erro",
      description: "Não foi possível criar o admin global. Tente novamente mais tarde.",
      variant: "destructive"
    });
    return false;
  }
};
