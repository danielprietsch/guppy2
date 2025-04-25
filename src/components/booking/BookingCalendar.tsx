import * as React from "react";
import { format, isBefore, startOfDay, parseISO, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BookingCalendarProps {
  selectedTurns: { [date: string]: string[] };
  onSelectTurn: (date: string, turn: string) => void;
  pricePerTurn: { [turn: string]: number };
  workspaceAvailability?: { morning: boolean; afternoon: boolean; evening: boolean };
  workspaceCreatedAt?: string;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedTurns,
  onSelectTurn,
  pricePerTurn,
  workspaceAvailability = { morning: true, afternoon: true, evening: true },
  workspaceCreatedAt
}) => {
  const [viewMonth, setViewMonth] = React.useState<Date>(new Date());
  const today = startOfDay(new Date());
  const [bookedTurns, setBookedTurns] = React.useState<{ [date: string]: { [turn: string]: boolean } }>({});
  
  React.useEffect(() => {
    const fetchBookings = async () => {
      if (!workspaceAvailability) return;
      
      try {
        const startDate = format(new Date(), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(), 60), 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('bookings')
          .select('date, shift')
          .gte('date', startDate)
          .lte('date', endDate)
          .not('status', 'eq', 'cancelled');
          
        if (error) throw error;
        
        const booked: { [date: string]: { [turn: string]: boolean } } = {};
        
        if (data) {
          data.forEach(booking => {
            if (!booked[booking.date]) {
              booked[booking.date] = { morning: false, afternoon: false, evening: false };
            }
            booked[booking.date][booking.shift as keyof typeof workspaceAvailability] = true;
          });
        }
        
        setBookedTurns(booked);
      } catch (error) {
        console.error("Erro ao buscar reservas existentes:", error);
      }
    };
    
    fetchBookings();
  }, [workspaceAvailability]);

  const renderTurnButton = (date: Date, turn: string, price: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedTurns[dateStr]?.includes(turn);
    const isPastDate = isBefore(date, today) && !isToday(date);
    const isClosed = !workspaceAvailability[turn as keyof typeof workspaceAvailability];
    const isBooked = bookedTurns[dateStr]?.[turn as keyof typeof workspaceAvailability];

    const getButtonClasses = () => {
      if (isPastDate) return "bg-gray-300 text-gray-500 cursor-not-allowed";
      if (isBooked) return "bg-red-300 text-red-800 cursor-not-allowed";
      if (isClosed) return "bg-yellow-300 text-yellow-800 cursor-not-allowed";
      if (isSelected) return "bg-blue-500 text-white";
      return "bg-green-500 text-white hover:bg-green-600";
    };
    
    const getButtonText = () => {
      if (isBooked) return turn === "morning" ? "Manhã (Reservado)" : turn === "afternoon" ? "Tarde (Reservado)" : "Noite (Reservado)";
      return turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite";
    };

    return (
      <Button
        key={turn}
        onClick={() => !isPastDate && !isClosed && !isBooked && onSelectTurn(dateStr, turn)}
        className={cn(
          "w-full p-2 text-xs font-medium rounded-sm transition-colors",
          getButtonClasses()
        )}
        disabled={isPastDate || isClosed || isBooked}
      >
        {getButtonText()}
        <div className="text-[10px] mt-0.5">
          R$ {price.toFixed(2).replace('.', ',')}
        </div>
      </Button>
    );
  };

  const renderDayContent = (day: Date) => {
    return (
      <div className="flex flex-col p-1 h-full">
        <div className="text-sm font-medium text-center">{format(day, "d")}</div>
        <div className="grid gap-1 mt-1">
          {["morning", "afternoon", "evening"].map((turn) => (
            renderTurnButton(day, turn, pricePerTurn[turn] || 50)
          ))}
        </div>
      </div>
    );
  };

  return (
    <Calendar
      mode="single"
      month={viewMonth}
      onMonthChange={setViewMonth}
      locale={ptBR}
      disabled={(date) => {
        if (isBefore(startOfDay(date), today)) return true;
        if (workspaceCreatedAt) {
          const creationDate = parseISO(workspaceCreatedAt);
          return isBefore(startOfDay(date), startOfDay(creationDate));
        }
        return false;
      }}
      className="w-full rounded-md border"
      classNames={{
        months: "w-full",
        month: "w-full",
        table: "w-full border-collapse",
        head_cell: "text-muted-foreground font-normal w-full text-center px-2",
        cell: "h-auto min-h-[160px] p-0 border border-border relative",
        day: "h-full w-full p-0 font-normal text-lg font-bold",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_hidden: "invisible",
      }}
      components={{
        DayContent: ({ date }) => renderDayContent(date)
      }}
    />
  );
};

export default BookingCalendar;
