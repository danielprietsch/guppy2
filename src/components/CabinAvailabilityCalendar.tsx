import * as React from "react";
import { format, isBefore, startOfDay, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotCard } from "@/components/owner/availability/TimeSlotCard";
import { useNavigate } from "react-router-dom";
import { debugAreaLog } from "@/utils/debugLogger";
import { toast } from "@/hooks/use-toast";

interface CabinAvailabilityCalendarProps {
  selectedTurn: "morning" | "afternoon" | "evening";
  daysBooked: { [date: string]: { [turn: string]: boolean } };
  onSelectDates: (dates: string[]) => void;
  selectedDates: string[];
  pricePerDay: number;
  onPriceChange?: (date: string, turn: string, price: string) => void;
  onStatusChange?: (date: string, turn: string, isManualClose: boolean) => void;
  manuallyClosedDates?: { [date: string]: { [turn: string]: boolean } };
  slotPrices?: { [date: string]: { [turn: string]: number } };
  cabinCreatedAt?: string;
}

const CabinAvailabilityCalendar: React.FC<CabinAvailabilityCalendarProps> = ({
  daysBooked,
  onPriceChange,
  onStatusChange,
  manuallyClosedDates = {},
  pricePerDay,
  slotPrices = {},
  cabinCreatedAt
}) => {
  const getInitialDate = React.useCallback(() => {
    if (cabinCreatedAt) {
      return parseISO(cabinCreatedAt);
    }
    return new Date();
  }, [cabinCreatedAt]);
  
  const [viewMonth, setViewMonth] = React.useState<Date>(getInitialDate);
  
  React.useEffect(() => {
    setViewMonth(getInitialDate());
  }, [cabinCreatedAt, getInitialDate]);
  
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  const fmtDate = (date: Date) => format(date, "yyyy-MM-dd");

  const getTurnoLabel = (turno: string) => {
    switch (turno) {
      case "morning": return "Manhã";
      case "afternoon": return "Tarde";
      case "evening": return "Noite";
      default: return turno;
    }
  };

  const handleStatusChange = React.useCallback((date: string, turno: string, isManualClose: boolean) => {
    debugAreaLog('AVAILABILITY', 'Solicitação de alteração de status:', { date, turno, isManualClose });
    
    if (onStatusChange) {
      try {
        onStatusChange(date, turno, isManualClose);
        toast({
          title: isManualClose ? "Turno fechado" : "Turno liberado",
          description: `${isManualClose ? "Fechado" : "Liberado"} o turno ${getTurnoLabel(turno)} para a data ${format(new Date(date), "dd/MM/yyyy")}`,
        });
        debugAreaLog('AVAILABILITY', 'Callback de alteração de status executado com sucesso');
      } catch (error) {
        debugAreaLog('AVAILABILITY', 'Erro no callback de alteração de status:', error);
        toast({
          title: "Erro",
          description: "Não foi possível alterar o status do turno.",
          variant: "destructive"
        });
      }
    } else {
      debugAreaLog('AVAILABILITY', 'Nenhum callback de alteração de status fornecido');
      toast({
        title: "Erro de configuração",
        description: "Função de alteração de status não encontrada.",
        variant: "destructive"
      });
    }
  }, [onStatusChange]);

  const handlePriceEdit = React.useCallback((date: string, turno: string, newPrice: string) => {
    const dateObj = new Date(date);
    
    if (isBefore(dateObj, today) && !isToday(dateObj)) {
      debugAreaLog('PRICE_EDIT', 'Não é possível alterar preço de datas passadas');
      toast({
        title: "Operação não permitida",
        description: "Não é possível alterar preço de datas passadas.",
        variant: "destructive"
      });
      return;
    }

    debugAreaLog('PRICE_EDIT', 'Handling price edit:', { date, turno, newPrice });
    
    if (onPriceChange) {
      try {
        onPriceChange(date, turno, newPrice);
        toast({
          title: "Preço atualizado",
          description: `Preço do turno ${getTurnoLabel(turno)} atualizado para R$ ${parseFloat(newPrice).toFixed(2)}`,
        });
        debugAreaLog('PRICE_EDIT', 'Price change callback executed successfully');
      } catch (error) {
        debugAreaLog('PRICE_EDIT', 'Erro no callback de alteração de preço:', error);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o preço do turno.",
          variant: "destructive"
        });
      }
    } else {
      debugAreaLog('PRICE_EDIT', 'Nenhum callback de alteração de preço fornecido');
      toast({
        title: "Erro de configuração",
        description: "Função de alteração de preço não encontrada.",
        variant: "destructive"
      });
    }
  }, [onPriceChange, today]);

  const getSlotPrice = React.useCallback((dateStr: string, turno: string): number => {
    return slotPrices?.[dateStr]?.[turno] || pricePerDay;
  }, [slotPrices, pricePerDay]);

  const isSlotManuallyClosed = React.useCallback((dateStr: string, turno: string): boolean => {
    const isClosed = manuallyClosedDates?.[dateStr]?.[turno] || false;
    debugAreaLog('AVAILABILITY', `Slot ${dateStr} ${turno} is manually closed: ${isClosed}`);
    return isClosed;
  }, [manuallyClosedDates]);

  const renderDayContent = React.useCallback((day: Date) => {
    const dateStr = fmtDate(day);
    const turnos = ["morning", "afternoon", "evening"];
    const isPastDate = isBefore(day, today) && !isToday(day);

    return (
      <div className="flex flex-col p-1 h-full">
        <div className="text-sm font-medium text-center">{format(day, "d")}</div>
        <div className="grid gap-1 mt-1">
          {turnos.map((turno) => (
            <TimeSlotCard
              key={`${dateStr}-${turno}`}
              turno={getTurnoLabel(turno)}
              price={getSlotPrice(dateStr, turno)}
              isBooked={daysBooked[dateStr]?.[turno] || false}
              isManuallyClosed={isSlotManuallyClosed(dateStr, turno)}
              onPriceEdit={(newPrice) => handlePriceEdit(dateStr, turno, newPrice)}
              onManualClose={() => handleStatusChange(dateStr, turno, true)}
              onRelease={() => handleStatusChange(dateStr, turno, false)}
              onViewBooking={() => navigate(`/owner/bookings/${dateStr}/${turno}`)}
              isPastDate={isPastDate}
              date={day}
            />
          ))}
        </div>
      </div>
    );
  }, [daysBooked, getSlotPrice, handlePriceEdit, handleStatusChange, isSlotManuallyClosed, navigate, today]);

  const MemoizedCalendar = React.useMemo(() => (
    <Calendar
      mode="single"
      month={viewMonth}
      onMonthChange={setViewMonth}
      locale={ptBR}
      disabled={(date) => {
        if (!cabinCreatedAt) return false;
        const creationDate = parseISO(cabinCreatedAt);
        return isBefore(startOfDay(date), startOfDay(creationDate));
      }}
      className="w-full rounded-md border"
      classNames={{
        months: "w-full",
        month: "w-full",
        table: "w-full border-collapse",
        head_cell: "text-muted-foreground font-normal w-full text-center px-2",
        cell: "h-auto min-h-[160px] p-0 border border-border relative",
        day: "h-full w-full p-0 font-normal text-lg font-bold",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
      }}
      components={{
        DayContent: ({ date }) => renderDayContent(date)
      }}
    />
  ), [viewMonth, renderDayContent, cabinCreatedAt]);

  return (
    <div className="space-y-4">
      {MemoizedCalendar}
    </div>
  );
};

export default React.memo(CabinAvailabilityCalendar);
