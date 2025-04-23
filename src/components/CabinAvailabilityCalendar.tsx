
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
      />
      <div className="flex items-center gap-4 mt-4">
        <span className="h-4 w-4 bg-green-500 rounded-full inline-block"></span>
        <span>Disponível</span>
        <span className="h-4 w-4 bg-red-500 rounded-full inline-block ml-4"></span>
        <span>Ocupado</span>
        <span className="h-4 w-4 bg-primary rounded-full inline-block ml-4"></span>
        <span>Selecionado</span>
      </div>
    </div>
  );
};

export default CabinAvailabilityCalendar;
