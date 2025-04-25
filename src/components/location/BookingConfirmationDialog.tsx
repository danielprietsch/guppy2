
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
      // Check if user is logged in first
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

      // Direct check using metadata to avoid recursion entirely
      const userType = session.user.user_metadata?.userType;
      
      if (userType === 'professional' || userType === 'provider') {
        onClose();
        navigate(`/book-cabin/${cabinId}`);
        return;
      }
      
      // Fallback: Use direct query instead of any RPC function to avoid recursion
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error("Error checking user type:", profileError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar seu tipo de usuário. Tente novamente.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      if (profileData.user_type === 'professional' || profileData.user_type === 'provider') {
        navigate(`/book-cabin/${cabinId}`);
      } else {
        toast({
          title: "Acesso restrito",
          description: "Apenas profissionais podem reservar espaços.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("Error during confirmation:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
      onClose();
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
