
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { toast } from "@/hooks/use-toast";

export const sendPasswordResetToGlobalAdmin = async () => {
  const adminEmail = 'guppyadmin@nuvemtecnologia.com';
  
  try {
    debugLog("Sending password reset to global admin");
    
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

// Helper function to check if an email is the global admin email
export const isGlobalAdminEmail = (email: string): boolean => {
  return email === 'guppyadmin@nuvemtecnologia.com';
};

// Modified function to handle global admin registration
export const handleGlobalAdminRegistration = async (data: { 
  email: string;
  password: string;
  name: string;
}) => {
  try {
    debugLog("Attempting to register global admin user");
    
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          userType: 'global_admin',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
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
    
    debugLog("Global admin registered successfully");
    toast({
      title: "Admin Global registrado",
      description: "Sua conta foi criada com sucesso. Verifique seu email para confirmar o cadastro."
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

// New function to recreate the global admin account
export const recreateGlobalAdmin = async () => {
  try {
    debugLog("Attempting to recreate global admin user");
    
    // First, let's try to find if the user exists (just to show better UI feedback)
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers({
      perPage: 1,
      filter: {
        email: 'guppyadmin@nuvemtecnologia.com'
      }
    });
    
    if (fetchError) {
      debugError("Error checking if global admin exists:", fetchError);
      // Continue with creation attempt even if check fails
    }
    
    // Default admin credentials
    const adminEmail = 'guppyadmin@nuvemtecnologia.com';
    const adminPassword = 'Guppy@Admin2025'; // More secure default password
    const adminName = 'Global Admin';
    
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          name: adminName,
          userType: 'global_admin',
          avatar_url: `https://ui-avatars.com/api/?name=Global+Admin&background=random`
        }
      }
    });
    
    if (error) {
      debugError("Error recreating global admin:", error);
      toast({
        title: "Erro ao recriar admin global",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
    
    debugLog("Global admin recreated successfully");
    toast({
      title: "Admin Global recriado",
      description: `Uma nova conta foi criada para ${adminEmail} com uma senha padrão. Faça login e depois altere a senha.`,
    });
    
    return true;
  } catch (error) {
    debugError("Unexpected error recreating global admin:", error);
    toast({
      title: "Erro",
      description: "Não foi possível recriar o admin global. Tente novamente mais tarde.",
      variant: "destructive"
    });
    return false;
  }
};
