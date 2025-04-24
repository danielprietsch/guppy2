
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotCard } from "@/components/owner/availability/TimeSlotCard";
import { useNavigate } from "react-router-dom";
import { debugAreaLog } from "@/utils/debugLogger";

interface CabinAvailabilityCalendarProps {
  selectedTurn: "morning" | "afternoon" | "evening";
  daysBooked: { [date: string]: { [turn: string]: boolean } };
  onSelectDates: (dates: string[]) => void;
  selectedDates: string[];
  pricePerDay: number;
  onPriceChange?: (date: string, turn: string, price: number) => void;
  onStatusChange?: (date: string, turn: string, isManualClose: boolean) => void;
  manuallyClosedDates?: { [date: string]: { [turn: string]: boolean } };
  slotPrices?: { [date: string]: { [turn: string]: number } };
}

const CabinAvailabilityCalendar: React.FC<CabinAvailabilityCalendarProps> = ({
  daysBooked,
  onPriceChange,
  onStatusChange,
  manuallyClosedDates = {},
  pricePerDay,
  slotPrices = {}
}) => {
  const [viewMonth, setViewMonth] = React.useState<Date>(new Date());
  const navigate = useNavigate();

  const fmtDate = (date: Date) => format(date, "yyyy-MM-dd");

  const getTurnoLabel = (turno: string) => {
    switch (turno) {
      case "morning": return "Manhã";
      case "afternoon": return "Tarde";
      case "evening": return "Noite";
      default: return turno;
    }
  };

  const handlePriceEdit = (date: string, turno: string, newPrice: number) => {
    debugAreaLog('PRICE_EDIT', 'Handling price edit:', { date, turno, newPrice });
    if (onPriceChange) {
      onPriceChange(date, turno, newPrice);
    }
  };

  const handleStatusChange = (date: string, turno: string, isManualClose: boolean) => {
    debugAreaLog('PRICE_EDIT', 'Status change:', { date, turno, isManualClose });
    if (onStatusChange) {
      onStatusChange(date, turno, isManualClose);
    }
  };

  const getSlotPrice = (dateStr: string, turno: string): number => {
    return slotPrices?.[dateStr]?.[turno] || pricePerDay;
  };

  // Memoize the day content rendering function
  const renderDayContent = React.useCallback((day: Date) => {
    const dateStr = fmtDate(day);
    const turnos = ["morning", "afternoon", "evening"];

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
              isManuallyClosed={manuallyClosedDates[dateStr]?.[turno] || false}
              onPriceEdit={(newPrice) => handlePriceEdit(dateStr, turno, newPrice)}
              onManualClose={() => handleStatusChange(dateStr, turno, true)}
              onRelease={() => handleStatusChange(dateStr, turno, false)}
              onViewBooking={() => navigate(`/owner/bookings/${dateStr}/${turno}`)}
            />
          ))}
        </div>
      </div>
    );
  }, [daysBooked, manuallyClosedDates, slotPrices, pricePerDay, navigate]);

  // Memoize the calendar component
  const MemoizedCalendar = React.useMemo(() => (
    <Calendar
      mode="single"
      month={viewMonth}
      onMonthChange={setViewMonth}
      locale={ptBR}
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
  ), [viewMonth, renderDayContent]);

  return (
    <div className="space-y-4">
      {MemoizedCalendar}
    </div>
  );
};

export default React.memo(CabinAvailabilityCalendar);
