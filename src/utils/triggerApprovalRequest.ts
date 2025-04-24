
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

export const triggerApprovalRequest = async (locationId: string, cabinsCount: number) => {
  try {
    debugLog("triggerApprovalRequest: Toggling visibility for location", locationId);
    debugLog("triggerApprovalRequest: Cabins count:", cabinsCount);
    
    // Validate the location has at least one cabin
    if (cabinsCount < 1) {
      debugLog("triggerApprovalRequest: Validation failed - No cabins");
      toast({
        title: "Erro",
        description: "O local precisa ter pelo menos uma cabine cadastrada para ser visível no sistema.",
        variant: "destructive",
      });
      return { success: false, message: "no-cabins" };
    }
    
    // Get current user's session to confirm auth state
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      debugLog("triggerApprovalRequest: No active session");
      toast({
        title: "Erro",
        description: "Você precisa estar logado para alterar a visibilidade do local.",
        variant: "destructive",
      });
      return { success: false, message: "not-authenticated" };
    }
    
    const userId = sessionData.session.user.id;
    
    // Verify location ownership using the security definer function
    const { data: isOwner, error: ownershipError } = await supabase
      .rpc('check_location_ownership', { 
        loc_id: locationId,
        user_id: userId 
      });
      
    if (ownershipError) {
      debugError("triggerApprovalRequest: Error checking ownership:", ownershipError);
      toast({
        title: "Erro",
        description: "Não foi possível verificar a propriedade do local.",
        variant: "destructive",
      });
      return { success: false, message: "ownership-check-error", error: ownershipError };
    }
      
    if (!isOwner) {
      debugError("triggerApprovalRequest: User does not own this location");
      toast({
        title: "Erro",
        description: "Você não tem permissão para alterar a visibilidade deste local.",
        variant: "destructive",
      });
      return { success: false, message: "unauthorized" };
    }
    
    // Get current status
    const { data: locationData, error: locationError } = await supabase
      .from('locations')
      .select('active')
      .eq('id', locationId)
      .single();
    
    if (locationError) {
      debugError("triggerApprovalRequest: Error fetching location:", locationError);
      toast({
        title: "Erro",
        description: "Não foi possível obter o status do local.",
        variant: "destructive",
      });
      return { success: false, message: "fetch-error", error: locationError };
    }
    
    const isCurrentlyActive = locationData?.active ?? false;
    
    // Toggle active status
    const { error: updateError } = await supabase
      .from('locations')
      .update({ active: !isCurrentlyActive })
      .eq('id', locationId);

    if (updateError) {
      debugError("triggerApprovalRequest: Error updating location status:", updateError);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a visibilidade do local.",
        variant: "destructive",
      });
      return { success: false, message: "update-error", error: updateError };
    }

    toast({
      title: "Sucesso",
      description: `Local ${!isCurrentlyActive ? "ativado" : "desativado"} com sucesso.`,
    });

    return { 
      success: true, 
      message: `visibility-${!isCurrentlyActive ? "enabled" : "disabled"}`,
      newStatus: !isCurrentlyActive
    };
    
  } catch (error) {
    debugError("triggerApprovalRequest: Unexpected error:", error);
    toast({
      title: "Erro",
      description: "Ocorreu um erro ao alterar a visibilidade do local.",
      variant: "destructive",
    });
    return { success: false, message: "unexpected-error", error };
  }
};
