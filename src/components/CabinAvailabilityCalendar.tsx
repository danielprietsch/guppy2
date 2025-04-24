
import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CabinAvailability {
  date: string; // yyyy-mm-dd
  turn: "morning" | "afternoon" | "evening";
  status: "available" | "booked";
}

interface CabinAvailabilityCalendarProps {
  selectedTurn: "morning" | "afternoon" | "evening";
  daysBooked: { [date: string]: { [turn: string]: boolean } }; // { "2025-04-23": { morning:true, afternoon:false, ... } }
  onSelectDates: (dates: string[]) => void;
  selectedDates: string[];
}

const CabinAvailabilityCalendar: React.FC<CabinAvailabilityCalendarProps> = ({
  selectedTurn,
  daysBooked,
  onSelectDates,
  selectedDates,
}) => {
  const [viewMonth, setViewMonth] = React.useState<Date>(new Date());

  // Helper to format date to yyyy-mm-dd
  const fmtDate = (date: Date) => format(date, "yyyy-MM-dd");

  // Function to check availability and color in calendar
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
    // Don't allow selecting already booked dates
    if (daysBooked[d] && daysBooked[d][selectedTurn]) {
      return;
    }
    if (selectedDates.includes(d)) {
      onSelectDates(selectedDates.filter((dt) => dt !== d));
    } else {
      onSelectDates([...selectedDates, d]);
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
      <div className="flex flex-col items-center w-full h-full">
        <div className="text-xs mb-1 font-medium">{format(day, "d")}</div>
        <div className="grid grid-cols-1 gap-1 w-full px-1">
          <div 
            className={cn(
              "h-2 w-full rounded-sm cursor-pointer",
              isBooked.morning 
                ? "bg-red-500" 
                : isSelected.morning 
                ? "bg-primary" 
                : "bg-green-500"
            )}
            onClick={(e) => {
              if (selectedTurn === "morning") {
                e.stopPropagation();
                handleDayClick(day);
              }
            }}
          />
          <div 
            className={cn(
              "h-2 w-full rounded-sm cursor-pointer",
              isBooked.afternoon 
                ? "bg-red-500" 
                : isSelected.afternoon 
                ? "bg-primary" 
                : "bg-green-500"
            )}
            onClick={(e) => {
              if (selectedTurn === "afternoon") {
                e.stopPropagation();
                handleDayClick(day);
              }
            }}
          />
          <div 
            className={cn(
              "h-2 w-full rounded-sm cursor-pointer",
              isBooked.evening 
                ? "bg-red-500" 
                : isSelected.evening 
                ? "bg-primary" 
                : "bg-green-500"
            )}
            onClick={(e) => {
              if (selectedTurn === "evening") {
                e.stopPropagation();
                handleDayClick(day);
              }
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <span className="font-medium mr-2">Turno selecionado:</span>
        <span className="capitalize">{selectedTurn === "morning" ? "Manhã" : selectedTurn === "afternoon" ? "Tarde" : "Noite"}</span>
      </div>
      <Calendar
        mode="multiple"
        selected={selectedDates.map((d) => new Date(d))}
        onDayClick={handleDayClick}
        month={viewMonth}
        onMonthChange={setViewMonth}
        modifiers={modifiers}
        className="pointer-events-auto"
        modifiersClassNames={{
          booked: "bg-red-500 text-white opacity-80 hover:bg-red-500 hover:text-white",
          selected: "bg-primary text-white hover:bg-primary hover:text-white",
          available: "bg-green-500 text-white opacity-80 hover:bg-green-600 hover:text-white"
        }}
        modifiersStyles={{
          booked: { color: "white" },
          selected: { color: "white" },
          available: { color: "white" }
        }}
        showOutsideDays={true}
        formatters={{
          formatCaption: (date) => format(date, "MMMM yyyy")
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
      <div className="flex items-center gap-4 mt-4">
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
