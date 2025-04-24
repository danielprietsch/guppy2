
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
