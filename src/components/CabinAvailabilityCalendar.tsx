
import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CabinAvailability {
  date: string;
  turn: "morning" | "afternoon" | "evening";
  status: "available" | "booked";
}

interface CabinAvailabilityCalendarProps {
  selectedTurn: "morning" | "afternoon" | "evening";
  daysBooked: { [date: string]: { [turn: string]: boolean } };
  onSelectDates: (dates: string[]) => void;
  selectedDates: string[];
  pricePerDay: number;
  onPriceChange?: (date: string, turn: string, price: number) => void;
}

const CabinAvailabilityCalendar: React.FC<CabinAvailabilityCalendarProps> = ({
  selectedTurn,
  daysBooked,
  onSelectDates,
  selectedDates,
  pricePerDay,
  onPriceChange
}) => {
  const [viewMonth, setViewMonth] = React.useState<Date>(new Date());
  const [editingPrice, setEditingPrice] = React.useState<{date: string; turn: string; price: number} | null>(null);

  const fmtDate = (date: Date) => format(date, "yyyy-MM-dd");

  const modifiers = {
    booked: (date: Date) =>
      daysBooked[fmtDate(date)] && daysBooked[fmtDate(date)][selectedTurn],
    selected: (date: Date) => selectedDates.includes(fmtDate(date)),
    available: (date: Date) => 
      !selectedDates.includes(fmtDate(date)) && 
      !(daysBooked[fmtDate(date)] && daysBooked[fmtDate(date)][selectedTurn])
  };

  const handleDayClick = (date: Date) => {
    const d = fmtDate(date);
    if (daysBooked[d] && daysBooked[d][selectedTurn]) {
      return;
    }
    if (selectedDates.includes(d)) {
      onSelectDates(selectedDates.filter((dt) => dt !== d));
    } else {
      onSelectDates([...selectedDates, d]);
    }
  };

  const handlePriceEdit = (date: string, turn: string, currentPrice: number) => {
    setEditingPrice({ date, turn, price: currentPrice });
  };

  const handlePriceChange = (newPrice: string) => {
    if (editingPrice && onPriceChange) {
      const price = parseFloat(newPrice);
      if (!isNaN(price) && price >= 0) {
        onPriceChange(editingPrice.date, editingPrice.turn, price);
      }
      setEditingPrice(null);
    }
  };

  const renderDayContent = (day: Date) => {
    const dateStr = fmtDate(day);
    const isBooked = {
      morning: daysBooked[dateStr]?.morning || false,
      afternoon: daysBooked[dateStr]?.afternoon || false,
      evening: daysBooked[dateStr]?.evening || false,
    };
    
    const isSelected = {
      morning: selectedTurn === "morning" && selectedDates.includes(dateStr),
      afternoon: selectedTurn === "afternoon" && selectedDates.includes(dateStr),
      evening: selectedTurn === "evening" && selectedDates.includes(dateStr),
    };

    return (
      <div className="flex flex-col items-center w-full h-full min-h-[100px]">
        <div className="text-xs mb-1 font-medium">{format(day, "d")}</div>
        <div className="grid grid-cols-1 gap-2 w-full px-2">
          {["morning", "afternoon", "evening"].map((turn) => {
            const isCurrentTurnSelected = selectedTurn === turn;
            return (
              <Popover key={turn}>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "h-6 w-full rounded-sm cursor-pointer transition-colors",
                      isBooked[turn as keyof typeof isBooked]
                        ? "bg-red-500"
                        : isSelected[turn as keyof typeof isSelected]
                        ? "bg-primary"
                        : "bg-green-500 hover:bg-green-600",
                      "relative group"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isCurrentTurnSelected) {
                        handleDayClick(day);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!isBooked[turn as keyof typeof isBooked]) {
                        handlePriceEdit(dateStr, turn, pricePerDay);
                      }
                    }}
                    title={`${turn.charAt(0).toUpperCase() + turn.slice(1)} - R$ ${pricePerDay}`}
                  >
                    {editingPrice?.date === dateStr && editingPrice?.turn === turn ? (
                      <Input
                        type="number"
                        className="w-full h-full p-0 text-xs"
                        value={editingPrice.price}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        onBlur={() => setEditingPrice(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handlePriceChange((e.target as HTMLInputElement).value);
                          }
                        }}
                      />
                    ) : null}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2" side="right">
                  <div className="text-xs">
                    <p className="font-medium">{format(day, "dd/MM/yyyy")}</p>
                    <p className="capitalize">{turn}</p>
                    <p>R$ {pricePerDay}</p>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <span className="font-medium mr-2">Turno selecionado:</span>
        <span className="capitalize">
          {selectedTurn === "morning" ? "Manhã" : selectedTurn === "afternoon" ? "Tarde" : "Noite"}
        </span>
      </div>
      <Calendar
        mode="multiple"
        selected={selectedDates.map((d) => new Date(d))}
        onDayClick={handleDayClick}
        month={viewMonth}
        onMonthChange={setViewMonth}
        modifiers={modifiers}
        className="w-full rounded-md border"
        classNames={{
          months: "w-full",
          month: "w-full",
          table: "w-full border-collapse",
          head_cell: "text-muted-foreground font-normal",
          cell: "h-[120px] w-full relative p-0 border border-border",
          day: "h-[120px] w-full p-0 font-normal aria-selected:opacity-100",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_outside: "opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
        }}
        components={{
          DayContent: ({ date, displayMonth }) => {
            const isOutsideMonth = displayMonth && date.getMonth() !== displayMonth.getMonth();
            return isOutsideMonth ? (
              <div className="text-xs opacity-50">{date.getDate()}</div>
            ) : (
              renderDayContent(date)
            );
          }
        }}
      />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 bg-green-500 rounded-full inline-block"></span>
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 bg-red-500 rounded-full inline-block"></span>
          <span>Ocupado</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 bg-primary rounded-full inline-block"></span>
          <span>Selecionado</span>
        </div>
      </div>
      <div className="border-t mt-3 pt-3">
        <h3 className="font-medium mb-2">Dias selecionados:</h3>
        {selectedDates.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedDates.map((date) => (
              <div key={date} className="text-sm bg-primary/10 rounded-md p-2 flex justify-between items-center">
                <span>{format(new Date(date), "dd/MM/yyyy")}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  onClick={() => onSelectDates(selectedDates.filter(d => d !== date))}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum dia selecionado</p>
        )}
      </div>
    </div>
  );
};

export default CabinAvailabilityCalendar;
