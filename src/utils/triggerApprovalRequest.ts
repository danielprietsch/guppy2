
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
    
    try {
      // Get current user's session to confirm auth state
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        debugLog("triggerApprovalRequest: No active session");
        toast({
          title: "Erro",
          description: "Você precisa estar logado para solicitar aprovação.",
          variant: "destructive",
        });
        return { success: false, message: "not-authenticated" };
      }

      // Use the security definer function to check approvals
      const { data: approvalData, error: approvalError } = await supabase
        .rpc('get_location_approval_status', { loc_id: locationId })
        .maybeSingle();

      if (approvalError) {
        debugLog("triggerApprovalRequest: Error checking approval status, verifying ownership");
        
        // Verify location ownership using the security definer function
        const { data: isOwner, error: ownershipError } = await supabase
          .rpc('check_location_ownership', { 
            loc_id: locationId,
            user_id: sessionData.session.user.id 
          });
          
        if (ownershipError || !isOwner) {
          debugError("triggerApprovalRequest: User does not own this location");
          toast({
            title: "Erro",
            description: "Você não tem permissão para solicitar aprovação para este local.",
            variant: "destructive",
          });
          return { success: false, message: "unauthorized" };
        }
      }

      // If we have approval data, check its status
      if (approvalData) {
        if (approvalData.status === "APROVADO") {
          debugLog("triggerApprovalRequest: Location already approved");
          toast({
            title: "Aviso",
            description: "Este local já foi aprovado.",
          });
          return { success: false, message: "already-approved" };
        }

        if (approvalData.status === "PENDENTE") {
          debugLog("triggerApprovalRequest: Approval already pending");
          toast({
            title: "Aviso",
            description: "Já existe uma solicitação de aprovação pendente para este local.",
          });
          return { success: false, message: "already-pending" };
        }

        // For rejected status - update to pending
        const { error: updateError } = await supabase
          .from('admin_approvals')
          .update({
            status: "PENDENTE",
            updated_at: new Date().toISOString()
          })
          .eq('id', approvalData.id);

        if (updateError) {
          debugError("triggerApprovalRequest: Error updating approval request:", updateError);
          toast({
            title: "Erro",
            description: "Não foi possível solicitar a aprovação do local.",
            variant: "destructive",
          });
          return { success: false, message: "update-error", error: updateError };
        }

        // Update location status
        await supabase
          .from('locations')
          .update({ active: false })
          .eq('id', locationId);

        toast({
          title: "Sucesso",
          description: "Solicitação de aprovação enviada com sucesso.",
        });

        return { success: true, message: "updated-pending" };
      }

      // No existing approval, create a new one
      debugLog("triggerApprovalRequest: Creating new approval request");
      const { error: insertError } = await supabase
        .from('admin_approvals')
        .insert({
          location_id: locationId,
          status: "PENDENTE"
        });

      if (insertError) {
        debugError("triggerApprovalRequest: Error creating approval request:", insertError);
        toast({
          title: "Erro",
          description: "Não foi possível solicitar a aprovação do local.",
          variant: "destructive",
        });
        return { success: false, message: "insert-error", error: insertError };
      }

      // Update location status
      await supabase
        .from('locations')
        .update({ active: false })
        .eq('id', locationId);

      toast({
        title: "Sucesso",
        description: "Solicitação de aprovação enviada com sucesso.",
      });

      return { success: true, message: "created-pending" };
    } catch (dbError) {
      debugError("triggerApprovalRequest: Database operation error:", dbError);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
      return { success: false, message: "db-error", error: dbError };
    }
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
