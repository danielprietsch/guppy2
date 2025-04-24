
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotCard } from "@/components/owner/availability/TimeSlotCard";
import { useNavigate } from "react-router-dom";
import { debugAreaLog, debugAreaCritical } from "@/utils/debugLogger";

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

  // Improved status change handler with more detailed debugging
  const handleStatusChange = React.useCallback((date: string, turno: string, isManualClose: boolean) => {
    debugAreaCritical('AVAILABILITY', 'Status change request:', { date, turno, isManualClose });
    
    if (onStatusChange) {
      try {
        onStatusChange(date, turno, isManualClose);
        debugAreaCritical('AVAILABILITY', 'Status change callback executed successfully');
      } catch (error) {
        debugAreaCritical('AVAILABILITY', 'Error in status change callback:', error);
      }
    } else {
      debugAreaCritical('AVAILABILITY', 'No status change callback provided');
    }
  }, [onStatusChange]);

  // Improved price edit handler with more detailed debugging
  const handlePriceEdit = React.useCallback((date: string, turno: string, newPrice: number) => {
    debugAreaLog('PRICE_EDIT', 'Handling price edit:', { date, turno, newPrice });
    
    if (onPriceChange) {
      try {
        onPriceChange(date, turno, newPrice);
        debugAreaLog('PRICE_EDIT', 'Price change callback executed successfully');
      } catch (error) {
        debugAreaCritical('PRICE_EDIT', 'Error in price change callback:', error);
      }
    } else {
      debugAreaLog('PRICE_EDIT', 'No price change callback provided');
    }
  }, [onPriceChange]);

  const getSlotPrice = React.useCallback((dateStr: string, turno: string): number => {
    return slotPrices?.[dateStr]?.[turno] || pricePerDay;
  }, [slotPrices, pricePerDay]);

  // Check if a slot is manually closed
  const isSlotManuallyClosed = React.useCallback((dateStr: string, turno: string): boolean => {
    const isClosed = manuallyClosedDates?.[dateStr]?.[turno] || false;
    debugAreaLog('AVAILABILITY', `Slot ${dateStr} ${turno} is manually closed: ${isClosed}`);
    return isClosed;
  }, [manuallyClosedDates]);

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
              isManuallyClosed={isSlotManuallyClosed(dateStr, turno)}
              onPriceEdit={(newPrice) => handlePriceEdit(dateStr, turno, newPrice)}
              onManualClose={() => {
                debugAreaCritical('AVAILABILITY', `Requesting manual close for ${dateStr} ${turno}`);
                handleStatusChange(dateStr, turno, true);
              }}
              onRelease={() => {
                debugAreaCritical('AVAILABILITY', `Requesting release for ${dateStr} ${turno}`);
                handleStatusChange(dateStr, turno, false);
              }}
              onViewBooking={() => navigate(`/owner/bookings/${dateStr}/${turno}`)}
            />
          ))}
        </div>
      </div>
    );
  }, [daysBooked, getSlotPrice, handlePriceEdit, handleStatusChange, isSlotManuallyClosed, navigate]);

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

// Using React.memo with custom comparison to prevent unnecessary re-renders
export default React.memo(CabinAvailabilityCalendar, (prevProps, nextProps) => {
  // Compare props to determine if re-render is necessary
  return (
    prevProps.pricePerDay === nextProps.pricePerDay &&
    JSON.stringify(prevProps.daysBooked) === JSON.stringify(nextProps.daysBooked) &&
    JSON.stringify(prevProps.manuallyClosedDates) === JSON.stringify(nextProps.manuallyClosedDates) &&
    JSON.stringify(prevProps.slotPrices) === JSON.stringify(nextProps.slotPrices)
  );
});
