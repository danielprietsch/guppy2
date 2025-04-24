
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { TimeSlotCard } from "@/components/owner/availability/TimeSlotCard";
import { useNavigate } from "react-router-dom";

interface CabinAvailabilityCalendarProps {
  selectedTurn: "morning" | "afternoon" | "evening";
  daysBooked: { [date: string]: { [turn: string]: boolean } };
  onSelectDates: (dates: string[]) => void;
  selectedDates: string[];
  pricePerDay: number;
  onPriceChange?: (date: string, turn: string, price: number) => void;
  onStatusChange?: (date: string, turn: string, isManualClose: boolean) => void;
  manuallyClosedDates?: { [date: string]: { [turn: string]: boolean } };
}

const CabinAvailabilityCalendar: React.FC<CabinAvailabilityCalendarProps> = ({
  daysBooked,
  onPriceChange,
  onStatusChange,
  manuallyClosedDates = {},
  pricePerDay
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

  const renderDayContent = (day: Date) => {
    const dateStr = fmtDate(day);
    const turnos = ["morning", "afternoon", "evening"];

    return (
      <div className="flex flex-col gap-2 p-2 min-h-[300px]">
        <div className="text-sm font-medium">{format(day, "d")}</div>
        <div className="grid gap-2">
          {turnos.map((turno) => (
            <TimeSlotCard
              key={`${dateStr}-${turno}`}
              turno={getTurnoLabel(turno)}
              price={pricePerDay}
              isBooked={daysBooked[dateStr]?.[turno] || false}
              isManuallyClosed={manuallyClosedDates[dateStr]?.[turno] || false}
              onPriceEdit={(newPrice) => onPriceChange?.(dateStr, turno, newPrice)}
              onManualClose={() => onStatusChange?.(dateStr, turno, true)}
              onRelease={() => onStatusChange?.(dateStr, turno, false)}
              onViewBooking={() => navigate(`/owner/bookings/${dateStr}/${turno}`)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
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
          head_cell: "text-muted-foreground font-normal",
          cell: "h-[350px] w-full relative p-0 border border-border",
          day: "h-[350px] w-full p-0 font-normal",
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
    </div>
  );
};

export default CabinAvailabilityCalendar;
