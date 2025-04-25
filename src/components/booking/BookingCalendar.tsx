
import * as React from "react";
import { format, isBefore, startOfDay, parseISO, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface BookingCalendarProps {
  selectedTurns: { [date: string]: string[] };
  onSelectTurn: (date: string, turn: string) => void;
  pricePerTurn: { [turn: string]: number };
  cabinAvailability?: { morning: boolean; afternoon: boolean; evening: boolean };
  cabinCreatedAt?: string;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedTurns,
  onSelectTurn,
  pricePerTurn,
  cabinAvailability = { morning: true, afternoon: true, evening: true },
  cabinCreatedAt
}) => {
  const [viewMonth, setViewMonth] = React.useState<Date>(new Date());
  const today = startOfDay(new Date());

  const renderTurnButton = (date: Date, turn: string, price: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedTurns[dateStr]?.includes(turn);
    const isPastDate = isBefore(date, today) && !isToday(date);
    const isClosed = !cabinAvailability[turn as keyof typeof cabinAvailability];

    const getButtonClasses = () => {
      if (isPastDate) return "bg-gray-300 text-gray-500 cursor-not-allowed";
      if (isClosed) return "bg-yellow-300 text-yellow-800 cursor-not-allowed";
      if (isSelected) return "bg-blue-500 text-white";
      return "bg-secondary hover:bg-secondary/80";
    };

    return (
      <Button
        key={turn}
        onClick={() => !isPastDate && !isClosed && onSelectTurn(dateStr, turn)}
        className={cn(
          "w-full p-2 text-xs font-medium rounded-sm transition-colors",
          getButtonClasses()
        )}
        disabled={isPastDate || isClosed}
      >
        {turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"}
        <div className="text-[10px] mt-0.5">
          R$ {price}
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
        // Disable past dates (before today)
        if (isBefore(startOfDay(date), today)) return true;
        // If cabin has a creation date, also disable dates before that
        if (cabinCreatedAt) {
          const creationDate = parseISO(cabinCreatedAt);
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
