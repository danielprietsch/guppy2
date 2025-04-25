
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError, debugBooking, debugBookingError, debugInspect } from "@/utils/debugLogger";

export const useBookingManagement = (cabinId: string, onClose: () => void) => {
  const navigate = useNavigate();
  const [selectedTurns, setSelectedTurns] = useState<{ [date: string]: string[] }>({});
  const [total, setTotal] = useState(0);
  const [subtotalTurns, setSubtotalTurns] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<string[]>([]);

  // Log initial cabin ID for debugging
  useEffect(() => {
    if (!cabinId) {
      debugBooking("Initial cabinId value is empty, waiting for a valid ID");
      return;
    }
    
    debugBooking("Initial cabinId value:", cabinId);
    
    // Validate the cabin ID at initialization
    if (!isValidUUID(cabinId)) {
      debugBookingError("Invalid cabin ID at initialization:", cabinId);
      setBookingErrors(prev => [...prev, `Cabin ID inválido: ${cabinId}`]);
    }
    
    // Reset selected turns when cabin changes
    setSelectedTurns({});
    setTotal(0);
    setSubtotalTurns(0);
    setServiceFee(0);
    setAcceptTerms(false);
    
  }, [cabinId]); // Reset when cabinId changes

  // Validate if cabinId is a proper UUID
  const isValidUUID = (id: string): boolean => {
    if (!id) {
      debugBookingError("isValidUUID: ID is null or undefined");
      return false;
    }
    
    if (typeof id !== 'string') {
      debugBookingError("isValidUUID: ID is not a string", typeof id, id);
      return false;
    }
    
    if (id.trim() === "") {
      debugBookingError("isValidUUID: ID is empty string");
      return false;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValid = uuidRegex.test(id);
    
    if (!isValid) {
      debugBookingError("isValidUUID: ID does not match UUID format:", id);
    } else {
      debugBooking("isValidUUID: Valid UUID confirmed:", id);
    }
    
    return isValid;
  };

  const handleTurnSelection = (date: string, turn: string) => {
    debugBooking("Turn selected:", date, turn);
    setSelectedTurns(prev => {
      const newTurns = { ...prev };
      if (newTurns[date]?.includes(turn)) {
        newTurns[date] = newTurns[date].filter(t => t !== turn);
        if (newTurns[date].length === 0) {
          delete newTurns[date];
        }
      } else {
        if (!newTurns[date]) {
          newTurns[date] = [];
        }
        newTurns[date] = [...newTurns[date], turn];
      }
      debugBooking("Updated selected turns:", newTurns);
      return newTurns;
    });
  };

  const handleBookCabin = async () => {
    debugBooking("handleBookCabin called with cabinId:", cabinId);
    
    // Reset error state
    setBookingErrors([]);
    
    // Deep validation before anything else
    if (!cabinId) {
      debugBookingError("handleBookCabin: cabinId is null or undefined");
      toast({
        title: "Erro grave",
        description: "ID do espaço não foi fornecido. Por favor, reinicie o processo de reserva.",
        variant: "destructive",
      });
      navigate("/locations");
      return;
    }
    
    if (Object.keys(selectedTurns).length === 0 || !acceptTerms) {
      debugBookingError("handleBookCabin: Missing selections or terms not accepted", 
        { turnsSelected: Object.keys(selectedTurns).length > 0, acceptTerms });
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um turno e aceite os termos",
        variant: "destructive",
      });
      return;
    }

    // Get session first to validate authentication
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      debugBookingError("handleBookCabin: No active session found");
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para reservar um espaço.",
        variant: "destructive",
      });
      navigate("/login", { state: { returnTo: `/book-cabin/${cabinId}` } });
      return;
    }

    // Validate user type
    const userType = data.session.user.user_metadata?.userType;
    debugBooking("User type:", userType);
    
    if (userType !== 'professional' && userType !== 'provider') {
      debugBookingError("handleBookCabin: User is not a professional or provider", userType);
      toast({
        title: "Acesso restrito",
        description: "Apenas profissionais podem reservar espaços.",
        variant: "destructive",
      });
      return;
    }

    // Triple check cabin ID validity before proceeding
    if (!isValidUUID(cabinId)) {
      debugBookingError("handleBookCabin: Invalid cabin ID format:", cabinId);
      toast({
        title: "Erro",
        description: "ID do espaço inválido. Por favor, selecione um espaço válido.",
        variant: "destructive",
      });
      return;
    }

    setBookingInProgress(true);
    
    try {
      debugBooking("Starting booking process with cabin ID:", cabinId);
      
      let allBookingsSuccessful = true;
      const bookingPromises = [];
      
      for (const [date, turns] of Object.entries(selectedTurns)) {
        debugBooking(`Processing bookings for date: ${date}, turns: ${turns.join(', ')}`);
        for (const turn of turns) {
          const turnPrice = total / Object.values(selectedTurns).flat().length;
          bookingPromises.push(createBooking(date, turn, turnPrice));
        }
      }
      
      const results = await Promise.all(bookingPromises);
      allBookingsSuccessful = results.every(result => result === true);
      debugBooking("Booking results:", results, "All successful:", allBookingsSuccessful);
      
      if (allBookingsSuccessful) {
        toast({
          title: "Reserva realizada com sucesso",
          description: "Sua reserva foi enviada e está aguardando pagamento.",
        });
        navigate("/client/reservations");
      } else {
        toast({
          title: "Erro parcial",
          description: "Algumas reservas não puderam ser realizadas. Verifique seu painel.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao realizar reservas:", error);
      debugBookingError("handleBookCabin exception:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar sua reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setBookingInProgress(false);
    }
  };

  const createBooking = async (date: string, turn: string, price: number) => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        debugBookingError("createBooking: No active session");
        throw new Error("Usuário não autenticado");
      }

      // Safety checks before proceeding
      if (!isValidUUID(cabinId)) {
        debugBookingError("createBooking: Invalid cabin ID:", cabinId);
        throw new Error("ID do espaço inválido");
      }

      const professionalId = data.session.user.id;
      if (!isValidUUID(professionalId)) {
        debugBookingError("createBooking: Invalid professional ID:", professionalId);
        throw new Error("ID do profissional inválido");
      }

      debugBooking("Creating booking with parameters:", {
        professional_id: professionalId,
        cabin_id: cabinId,
        date,
        shift: turn,
        price
      });

      // Use the RPC function to create the booking
      const { data: bookingData, error } = await supabase.rpc(
        'create_booking',
        { 
          cabin_id: cabinId,
          professional_id: professionalId,
          date, 
          shift: turn, 
          price,
          status: 'payment_pending'
        }
      );

      if (error) {
        debugBookingError("Erro ao criar reserva via RPC:", error);
        throw error;
      }
      
      debugBooking("Booking created successfully:", bookingData);
      return true;
    } catch (error) {
      debugBookingError("Erro ao criar reserva:", error);
      return false;
    }
  };

  return {
    selectedTurns,
    total,
    subtotalTurns,
    serviceFee,
    bookingInProgress,
    acceptTerms,
    bookingErrors,
    setAcceptTerms,
    handleTurnSelection,
    handleBookCabin,
    setTotal,
    setSubtotalTurns,
    setServiceFee
  };
};
