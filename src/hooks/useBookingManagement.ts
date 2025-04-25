
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useBookingManagement = (cabinId: string, onClose: () => void) => {
  const navigate = useNavigate();
  const [selectedTurns, setSelectedTurns] = useState<{ [date: string]: string[] }>({});
  const [total, setTotal] = useState(0);
  const [subtotalTurns, setSubtotalTurns] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleTurnSelection = (date: string, turn: string) => {
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
      return newTurns;
    });
  };

  const handleBookCabin = async () => {
    if (Object.keys(selectedTurns).length === 0 || !acceptTerms) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um turno e aceite os termos",
        variant: "destructive",
      });
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para reservar um espaço.",
        variant: "destructive",
      });
      navigate("/login", { state: { returnTo: `/book-cabin/${cabinId}` } });
      return;
    }

    const userType = data.session.user.user_metadata?.userType;
    if (userType !== 'professional' && userType !== 'provider') {
      toast({
        title: "Acesso restrito",
        description: "Apenas profissionais podem reservar espaços.",
        variant: "destructive",
      });
      return;
    }

    // Validate cabin ID before proceeding
    if (!cabinId || cabinId.trim() === "") {
      toast({
        title: "Erro",
        description: "ID do espaço inválido. Por favor, selecione um espaço válido.",
        variant: "destructive",
      });
      return;
    }

    setBookingInProgress(true);
    
    try {
      let allBookingsSuccessful = true;
      const bookingPromises = [];
      
      for (const [date, turns] of Object.entries(selectedTurns)) {
        for (const turn of turns) {
          const turnPrice = total / Object.values(selectedTurns).flat().length;
          bookingPromises.push(createBooking(date, turn, turnPrice));
        }
      }
      
      const results = await Promise.all(bookingPromises);
      allBookingsSuccessful = results.every(result => result === true);
      
      if (allBookingsSuccessful) {
        toast({
          title: "Reserva realizada com sucesso",
          description: "Sua reserva foi enviada e está aguardando pagamento.",
        });
        navigate("/professional-dashboard");
      } else {
        toast({
          title: "Erro parcial",
          description: "Algumas reservas não puderam ser realizadas. Verifique seu painel.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao realizar reservas:", error);
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
        throw new Error("Usuário não autenticado");
      }

      // Verify all fields are valid before calling the RPC function
      if (!cabinId || cabinId.trim() === "") {
        debugError("createBooking: Invalid cabin ID");
        throw new Error("ID do espaço inválido");
      }

      const professionalId = data.session.user.id;
      if (!professionalId || professionalId.trim() === "") {
        debugError("createBooking: Invalid professional ID");
        throw new Error("ID do profissional inválido");
      }

      debugLog("Creating booking with professional_id:", professionalId);
      debugLog("Creating booking with cabin_id:", cabinId);
      debugLog("Creating booking for date:", date, "shift:", turn);

      const { error } = await supabase.rpc(
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
        debugError("Erro ao criar reserva:", error);
        throw error;
      }
      
      return true;
    } catch (error) {
      debugError("Erro ao criar reserva:", error);
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
    setAcceptTerms,
    handleTurnSelection,
    handleBookCabin,
    setTotal,
    setSubtotalTurns,
    setServiceFee
  };
};
