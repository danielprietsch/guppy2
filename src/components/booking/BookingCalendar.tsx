
import * as React from "react";
import { format, isBefore, startOfDay, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface BookingCalendarProps {
  selectedTurns: { [date: string]: string[] };
  onSelectTurn: (date: string, turn: string) => void;
  pricePerTurn: { [turn: string]: number };
  cabinCreatedAt?: string;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  selectedTurns,
  onSelectTurn,
  pricePerTurn,
  cabinCreatedAt
}) => {
  const [viewMonth, setViewMonth] = React.useState<Date>(cabinCreatedAt ? parseISO(cabinCreatedAt) : new Date());
  const today = startOfDay(new Date());

  const renderTurnButton = (date: Date, turn: string, price: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isSelected = selectedTurns[dateStr]?.includes(turn);
    const isPastDate = isBefore(date, today) && !isToday(date);

    return (
      <Button
        key={turn}
        onClick={() => !isPastDate && onSelectTurn(dateStr, turn)}
        className={cn(
          "w-full p-2 text-xs font-medium rounded-sm transition-colors",
          isSelected ? "bg-primary text-primary-foreground" : "bg-secondary",
          isPastDate ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/80",
        )}
        disabled={isPastDate}
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
