
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

  // Função para verificar disponibilidade e cor no calendário
  const modifiers = {
    booked: (date: Date) =>
      daysBooked[fmtDate(date)] && daysBooked[fmtDate(date)][selectedTurn],
    selected: (date: Date) => selectedDates.includes(fmtDate(date)),
  };

  const handleDayClick = (date: Date) => {
    const d = fmtDate(date);
    // Não permite selecionar datas já reservadas
    if (daysBooked[d] && daysBooked[d][selectedTurn]) {
      return;
    }
    if (selectedDates.includes(d)) {
      onSelectDates(selectedDates.filter((dt) => dt !== d));
    } else {
      onSelectDates([...selectedDates, d]);
    }
  };

  // Renderização customizada para colorir os dias
  function dayClassName(date: Date) {
    const d = fmtDate(date);
    let base = "h-9 w-9 p-0 font-normal";
    if (daysBooked[d] && daysBooked[d][selectedTurn]) {
      base += " bg-red-500 text-white opacity-80";
    } else if (selectedDates.includes(d)) {
      base += " bg-primary text-white";
    } else {
      base += " bg-green-500 text-white opacity-80";
    }
    return base;
  }

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
        classNames={{
          day: (date) => dayClassName(date),
        }}
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
