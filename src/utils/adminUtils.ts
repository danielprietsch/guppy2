import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { toast } from "@/hooks/use-toast";

/**
 * Adds the admin role to the specified user
 */
export const addAdminRole = async (userId: string): Promise<boolean> => {
  debugLog("addAdminRole: Adding admin role to user", userId);
  
  try {
    // First check if user already has admin role
    const { data: existingRole, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
      
    if (checkError) {
      debugError("addAdminRole: Error checking existing admin role:", checkError);
      return false;
    }
    
    // If user already has admin role, no need to add it again
    if (existingRole) {
      debugLog("addAdminRole: User already has admin role");
      return true;
    }
    
    // Add admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      });
      
    if (insertError) {
      debugError("addAdminRole: Error adding admin role:", insertError);
      return false;
    }
    
    debugLog("addAdminRole: Admin role added successfully");
    return true;
  } catch (error) {
    debugError("addAdminRole: Unexpected error:", error);
    return false;
  }
};

export const createGlobalAdmin = async () => {
  try {
    debugLog("Creating global admin user");
    
    const { data, error } = await supabase.auth.signUp({
      email: 'guppyadmin@nuvemtecnologia.com',
      password: 'Dani12qw',
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
      description: "O usuário global admin foi criado com sucesso."
    });
    
    return true;
  } catch (error) {
    debugError("Unexpected error creating global admin:", error);
    return false;
  }
};
