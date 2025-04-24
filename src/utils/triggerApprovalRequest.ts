
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

      // Instead of using RPC which is causing TypeScript errors, use a direct query
      // Since the RPC function is defined in the database but not in the TypeScript types
      const { data: existingApproval, error: checkError } = await supabase
        .from('admin_approvals')
        .select('id, status')
        .eq('location_id', locationId)
        .maybeSingle();

      if (checkError) {
        // If there's an error with the direct query, fallback to location check
        debugLog("triggerApprovalRequest: Direct query failed, falling back to location check");
        const userId = sessionData.session.user.id;
        
        const { data: locationCheck } = await supabase
          .from('locations')
          .select('id, owner_id')
          .eq('id', locationId)
          .eq('owner_id', userId)
          .maybeSingle();
          
        if (!locationCheck) {
          debugError("triggerApprovalRequest: User does not own this location");
          toast({
            title: "Erro",
            description: "Você não tem permissão para solicitar aprovação para este local.",
            variant: "destructive",
          });
          return { success: false, message: "unauthorized" };
        }
        
        // Direct query for approvals without relying on complex policies
        const { data: approvalCheck, error: directError } = await supabase
          .from('admin_approvals')
          .select('id, status')
          .eq('location_id', locationId)
          .maybeSingle();
          
        if (directError) {
          debugError("triggerApprovalRequest: Error checking approvals:", directError);
          toast({
            title: "Erro",
            description: "Não foi possível verificar solicitações existentes.",
            variant: "destructive",
          });
          return { success: false, message: "check-error", error: directError };
        }
        
        // Use the direct query result
        if (approvalCheck?.status === "APROVADO") {
          debugLog("triggerApprovalRequest: Location already approved");
          toast({
            title: "Aviso",
            description: "Este local já foi aprovado.",
          });
          return { success: false, message: "already-approved" };
        }
        
        if (approvalCheck?.status === "PENDENTE") {
          debugLog("triggerApprovalRequest: Approval already pending");
          toast({
            title: "Aviso",
            description: "Já existe uma solicitação de aprovação pendente para este local.",
          });
          return { success: false, message: "already-pending" };
        }
        
        // If there's an existing rejected request that we're retrying
        if (approvalCheck?.id) {
          debugLog("triggerApprovalRequest: Updating existing rejected request:", approvalCheck.id);
          
          // Update the existing request to pending
          const { error: updateError } = await supabase
            .from('admin_approvals')
            .update({
              status: "PENDENTE",
              updated_at: new Date().toISOString()
            })
            .eq('id', approvalCheck.id);
            
          if (updateError) {
            debugError("triggerApprovalRequest: Error updating approval request:", updateError);
            toast({
              title: "Erro",
              description: "Não foi possível solicitar a aprovação do local.",
              variant: "destructive",
            });
            return { success: false, message: "update-error", error: updateError };
          }
          
          // Also update location status
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
        
        // Create a new approval request
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
        
        // Also update the location status
        await supabase
          .from('locations')
          .update({ active: false })
          .eq('id', locationId);
        
        toast({
          title: "Sucesso",
          description: "Solicitação de aprovação enviada com sucesso.",
        });
        
        return { success: true, message: "created-pending" };
      } else {
        // If direct query worked, use its result
        if (existingApproval) {
          if (existingApproval.status === "APROVADO") {
            debugLog("triggerApprovalRequest: Location already approved");
            toast({
              title: "Aviso",
              description: "Este local já foi aprovado.",
            });
            return { success: false, message: "already-approved" };
          }
          
          if (existingApproval.status === "PENDENTE") {
            debugLog("triggerApprovalRequest: Approval already pending");
            toast({
              title: "Aviso",
              description: "Já existe uma solicitação de aprovação pendente para este local.",
            });
            return { success: false, message: "already-pending" };
          }
          
          // For rejected status or any other status - update to pending
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
          
          // Also update location status
          await supabase
            .from('locations')
            .update({ active: false })
            .eq('id', locationId);
          
          toast({
            title: "Sucesso",
            description: "Solicitação de aprovação enviada com sucesso.",
          });
          
          return { success: true, message: "updated-pending" };
        } else {
          // No existing approval, create a new one
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
          
          // Also update the location status
          await supabase
            .from('locations')
            .update({ active: false })
            .eq('id', locationId);
          
          toast({
            title: "Sucesso",
            description: "Solicitação de aprovação enviada com sucesso.",
          });
          
          return { success: true, message: "created-pending" };
        }
      }
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

