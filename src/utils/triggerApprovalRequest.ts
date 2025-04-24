
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

export const triggerApprovalRequest = async (locationId: string, cabinsCount: number) => {
  try {
    debugLog("triggerApprovalRequest: Starting approval request for location", locationId);
    debugLog("triggerApprovalRequest: Cabins count:", cabinsCount);
    
    // Validate the location has at least one cabin
    if (cabinsCount < 1) {
      debugLog("triggerApprovalRequest: Validation failed - No cabins");
      toast({
        title: "Erro",
        description: "O local precisa ter pelo menos uma cabine cadastrada para solicitar aprovação.",
        variant: "destructive",
      });
      return { success: false, message: "no-cabins" };
    }
    
    // Check if there's already an approval request
    debugLog("triggerApprovalRequest: Checking for existing approval requests");
    const { data: existingApproval, error: checkError } = await supabase
      .from('admin_approvals')
      .select('id, status')
      .eq('location_id', locationId)
      .maybeSingle();
      
    if (checkError) {
      debugError("triggerApprovalRequest: Error checking existing approval:", checkError);
      toast({
        title: "Erro",
        description: "Não foi possível verificar solicitações existentes.",
        variant: "destructive",
      });
      return { success: false, message: "check-error", error: checkError };
    }
    
    // If there's an existing approved request, don't create a new one
    if (existingApproval?.status === "APROVADO") {
      debugLog("triggerApprovalRequest: Location already approved");
      toast({
        title: "Aviso",
        description: "Este local já foi aprovado.",
      });
      return { success: false, message: "already-approved" };
    }
    
    // If there's a pending request, don't create a new one
    if (existingApproval?.status === "PENDENTE") {
      debugLog("triggerApprovalRequest: Approval already pending");
      toast({
        title: "Aviso",
        description: "Já existe uma solicitação de aprovação pendente para este local.",
      });
      return { success: false, message: "already-pending" };
    }
    
    // If there's an existing rejected request that we're retrying
    if (existingApproval?.id) {
      debugLog("triggerApprovalRequest: Updating existing rejected request:", existingApproval.id);
      
      // Update the existing request to pending
      const { error: updateError } = await supabase
        .from('admin_approvals')
        .update({
          status: "PENDENTE",
          updated_at: new Date().toISOString()
        })
        .eq('id', existingApproval.id);
        
      if (updateError) {
        debugError("triggerApprovalRequest: Error updating approval request:", updateError);
        toast({
          title: "Erro",
          description: "Não foi possível solicitar a aprovação do local.",
          variant: "destructive",
        });
        return { success: false, message: "update-error", error: updateError };
      }
      
      toast({
        title: "Sucesso",
        description: "Solicitação de aprovação enviada com sucesso.",
      });
      
      return { success: true, message: "updated-pending" };
    }
    
    // Create a new approval request
    debugLog("triggerApprovalRequest: Creating new approval request");
    const { error } = await supabase
      .from('admin_approvals')
      .insert({
        location_id: locationId,
        status: "PENDENTE"
      });
      
    if (error) {
      debugError("triggerApprovalRequest: Error creating approval request:", error);
      toast({
        title: "Erro",
        description: "Não foi possível solicitar a aprovação do local.",
        variant: "destructive",
      });
      return { success: false, message: "insert-error", error };
    }
    
    // Also update the location status to ensure consistency
    await supabase
      .from('locations')
      .update({ active: false })
      .eq('id', locationId);
    
    toast({
      title: "Sucesso",
      description: "Solicitação de aprovação enviada com sucesso.",
    });
    
    return { success: true, message: "created-pending" };
    
  } catch (error) {
    debugError("triggerApprovalRequest: Unexpected error:", error);
    toast({
      title: "Erro",
      description: "Ocorreu um erro ao solicitar a aprovação.",
      variant: "destructive",
    });
    return { success: false, message: "unexpected-error", error };
  }
};
