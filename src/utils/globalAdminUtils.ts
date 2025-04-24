
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { toast } from "@/hooks/use-toast";

export const createGlobalAdmin = async () => {
  const adminEmail = 'guppyadmin@nuvemtecnologia.com';
  
  try {
    debugLog("Creating global admin user");
    
    // First check if the admin already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .eq('user_type', 'global_admin')
      .single();
      
    if (existingAdmin) {
      debugLog("Global admin already exists");
      return;
    }

    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: 'temp' + Math.random().toString(36),
      options: {
        data: {
          name: 'Administrador Global',
          userType: 'global_admin',
        }
      }
    });

    if (authError) {
      debugError("Error creating global admin:", authError);
      return;
    }

    // Send password reset email
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      adminEmail,
      {
        redirectTo: window.location.origin + '/reset-password',
      }
    );

    if (resetError) {
      debugError("Error sending reset password email:", resetError);
      return;
    }

    debugLog("Global admin created successfully");
  } catch (error) {
    debugError("Error in createGlobalAdmin:", error);
  }
};
