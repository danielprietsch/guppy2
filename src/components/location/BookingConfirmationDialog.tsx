
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
      // First check session without fetching profile data
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para reservar um espaço.",
          variant: "destructive",
        });
        
        onClose();
        navigate("/login", { state: { returnTo: `/book-cabin/${cabinId}` } });
        return;
      }

      // RADICAL SOLUTION: Use ONLY user metadata from the session
      // This completely bypasses any profiles table queries that could cause recursion
      const userType = session.user.user_metadata?.userType;
      
      if (userType === 'professional' || userType === 'provider') {
        // Skip all other checks - proceed directly to booking page
        onClose();
        navigate(`/book-cabin/${cabinId}`);
        return;
      }
      
      // If metadata doesn't confirm professional status, don't even try to check profiles
      // Just show access denied message
      toast({
        title: "Acesso restrito",
        description: "Apenas profissionais podem reservar espaços. Verifique seu cadastro.",
        variant: "destructive",
      });
      onClose();
      
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
