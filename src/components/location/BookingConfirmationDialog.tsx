
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError, debugBooking, debugBookingError, debugInspect } from "@/utils/debugLogger";

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

  // Debug when component mounts or cabinId changes
  useEffect(() => {
    if (isOpen) {
      debugBooking("BookingConfirmationDialog opened with cabinId:", cabinId);
      const isValidId = validateCabinId(cabinId);
      debugBooking("Cabin ID validation result:", isValidId);
    }
  }, [isOpen, cabinId]);

  // Helper function to validate cabinId
  const validateCabinId = (id: string | undefined): boolean => {
    // Check for null/undefined
    if (!id) {
      debugBookingError("validateCabinId: ID is null or undefined", id);
      return false;
    }
    
    // Check type
    if (typeof id !== 'string') {
      debugBookingError("validateCabinId: ID is not a string", typeof id, id);
      return false;
    }
    
    // Check for empty string
    if (id.trim() === "") {
      debugBookingError("validateCabinId: ID is empty string");
      return false;
    }
    
    // Check UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValid = uuidRegex.test(id);
    
    if (!isValid) {
      debugBookingError("validateCabinId: ID does not match UUID format:", id);
    } else {
      debugBooking("validateCabinId: Valid UUID confirmed:", id);
    }
    
    return isValid;
  };

  const handleConfirm = async () => {
    setIsChecking(true);
    debugBooking("BookingConfirmation: handleConfirm called with cabinId:", cabinId);
    
    try {
      // Enhanced validation with detailed logging
      if (!cabinId) {
        debugBookingError("BookingConfirmation: cabinId is null or undefined");
        toast({
          title: "Erro grave",
          description: "ID do espaço não foi fornecido. Por favor, reinicie o processo.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      // Validate type
      if (typeof cabinId !== 'string') {
        debugBookingError("BookingConfirmation: cabinId is not a string", typeof cabinId, cabinId);
        toast({
          title: "Erro",
          description: "ID do espaço inválido. Por favor, selecione um espaço válido.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      // Validate not empty
      if (cabinId.trim() === "") {
        debugBookingError("BookingConfirmation: cabinId is empty string");
        toast({
          title: "Erro",
          description: "ID do espaço inválido. Por favor, selecione um espaço válido.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // Check if ID format is valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(cabinId)) {
        debugBookingError("BookingConfirmation: Malformed UUID for cabin ID:", cabinId);
        toast({
          title: "Formato inválido",
          description: "O formato do ID do espaço é inválido.",
          variant: "destructive",
        });
        onClose();
        return;
      }

      // Verify if cabin exists in database before proceeding
      try {
        debugBooking("Checking if cabin exists in database:", cabinId);
        const { data: cabinData, error: cabinError } = await supabase
          .from('cabins')
          .select('id, name')
          .eq('id', cabinId)
          .single();
        
        if (cabinError || !cabinData) {
          debugBookingError("BookingConfirmation: Cabin not found in database:", cabinId, cabinError);
          toast({
            title: "Espaço não encontrado",
            description: "O espaço selecionado não foi encontrado no sistema.",
            variant: "destructive",
          });
          onClose();
          return;
        }
        
        debugBooking("Cabin exists in database:", cabinData);
      } catch (cabinCheckError) {
        debugBookingError("BookingConfirmation: Error checking cabin existence:", cabinCheckError);
      }

      // ONLY use auth.getSession() - avoid ALL database queries at this stage
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        debugBookingError("BookingConfirmation: No active session found");
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
      debugBooking("BookingConfirmation: User type from metadata:", userType);
      
      // Only allow professionals to proceed to booking page
      if (userType !== 'professional' && userType !== 'provider') {
        debugBookingError("BookingConfirmation: User is not a professional");
        toast({
          title: "Acesso restrito",
          description: "Apenas profissionais podem reservar espaços.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      debugBooking("BookingConfirmation: Professional user found, proceeding to booking page with cabin ID:", cabinId);
      onClose();
      
      // Pass cabin ID through URL params instead of state to avoid loss of data
      navigate(`/book-cabin/${cabinId}`);
      
    } catch (error) {
      console.error("Error during confirmation:", error);
      debugBookingError("BookingConfirmation exception:", error);
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
