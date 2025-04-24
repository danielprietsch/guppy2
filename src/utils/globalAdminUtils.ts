
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
  return false;
};

// Modified function to handle global admin registration
export const handleGlobalAdminRegistration = async (data: { 
  email: string;
  password: string;
  name: string;
}) => {
  try {
    debugLog("Attempting to register global admin user");
    
    // First check if we already have a user with this email
    const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (!checkError && existingUser?.user) {
      debugLog("User already exists, updating metadata instead");
      
      // User exists, update their metadata to global_admin
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name: data.name,
          userType: 'global_admin',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
        }
      });
      
      if (updateError) {
        debugError("Error updating existing user to global admin:", updateError);
        toast({
          title: "Erro ao atualizar usuário",
          description: updateError.message,
          variant: "destructive"
        });
        return false;
      }
      
      // Now try to update or insert the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: existingUser.user.id,
          name: data.name,
          email: data.email,
          user_type: 'global_admin',
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
        });
        
      if (profileError) {
        debugError("Error updating global admin profile:", profileError);
        toast({
          title: "Aviso",
          description: "Perfil atualizado, mas houve um problema com o tipo de usuário. Contate o suporte.",
          variant: "destructive"
        });
        return false;
      }
      
      debugLog("Existing user updated to global admin successfully");
      toast({
        title: "Perfil Atualizado",
        description: "Sua conta foi atualizada para Administrador Global."
      });
      
      return true;
    }
    
    // If we get here, we need to create a new user
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
    
    // We successfully signed up, but now need to check if we can create the profile
    if (signUpData && signUpData.user) {
      debugLog("Auth account created, now creating profile for global admin");
      
      // First try to get the allowed user_type values from the profiles table
      const { data: allowedUserTypes } = await supabase
        .rpc('get_allowed_user_types');
        
      debugLog("Allowed user types:", allowedUserTypes);
      
      // Let's manually insert into the profiles table with a valid user_type
      // If global_admin isn't a valid enum value, we'll use "admin" as a fallback
      const userType = Array.isArray(allowedUserTypes) && 
                       (allowedUserTypes as string[]).includes('global_admin') ? 
                       'global_admin' : 'admin';
      
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: signUpData.user.id,
            name: data.name,
            email: data.email,
            user_type: userType,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
          });
          
        if (profileError) {
          debugError("Error creating global admin profile:", profileError);
          toast({
            title: "Aviso",
            description: "Conta criada, mas houve um problema ao configurar o perfil como admin global."
          });
        } else {
          debugLog("Global admin profile created successfully");
        }
      } catch (profileInsertError) {
        debugError("Error inserting global admin profile:", profileInsertError);
      }
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
