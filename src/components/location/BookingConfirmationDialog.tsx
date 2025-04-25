
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog } from "@/utils/debugLogger";

interface BookingConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cabinId: string;
}

export const BookingConfirmationDialog = ({
  isOpen,
  onClose,
  cabinId,
}: BookingConfirmationDialogProps) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(false);

  const handleConfirm = async () => {
    setIsChecking(true);
    
    try {
      // Validate cabin ID
      if (!cabinId || cabinId.trim() === "") {
        debugLog("BookingConfirmation: Invalid cabin ID");
        toast({
          title: "Erro",
          description: "ID do espaço inválido. Por favor, selecione um espaço válido.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // ONLY use auth.getSession() - avoid ALL database queries at this stage
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        debugLog("BookingConfirmation: No active session found");
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para reservar um espaço.",
          variant: "destructive",
        });
        
        onClose();
        navigate("/login", { state: { returnTo: `/book-cabin/${cabinId}` } });
        return;
      }

      // Check user type directly from user metadata WITHOUT any database queries
      const userType = session.user.user_metadata?.userType;
      
      // Only allow professionals to proceed to booking page
      if (userType !== 'professional' && userType !== 'provider') {
        debugLog("BookingConfirmation: User is not a professional");
        toast({
          title: "Acesso restrito",
          description: "Apenas profissionais podem reservar espaços.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      debugLog("BookingConfirmation: Professional user found, proceeding to booking page");
      onClose();
      navigate(`/book-cabin/${cabinId}`);
      
    } catch (error) {
      console.error("Error during confirmation:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
      onClose();
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reservar Espaço</DialogTitle>
          <DialogDescription>
            Deseja prosseguir para a página de reserva deste espaço?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isChecking}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isChecking}>
            {isChecking ? "Verificando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
