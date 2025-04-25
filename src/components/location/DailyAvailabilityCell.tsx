
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ShiftAvailability {
  totalCabins: number;
  availableCabins: number;
  manuallyClosedCount: number;
}

interface DailyAvailabilityCellProps {
  date: Date;
  shifts: {
    morning: ShiftAvailability;
    afternoon: ShiftAvailability;
    evening: ShiftAvailability;
  };
}

export const DailyAvailabilityCell = ({ date, shifts }: DailyAvailabilityCellProps) => {
  const getStatusColor = (shift: ShiftAvailability) => {
    if (shift.manuallyClosedCount === shift.totalCabins) {
      return "bg-yellow-500";
    }
    return shift.availableCabins > 0 ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = (shift: ShiftAvailability) => {
    if (shift.manuallyClosedCount === shift.totalCabins) {
      return "Fechado";
    }
    return shift.availableCabins > 0 ? `${shift.availableCabins} livre${shift.availableCabins > 1 ? 's' : ''}` : "Reservado";
  };

  return (
    <div className="text-xs">
      <div className="font-medium mb-1">
        {format(date, "EEE", { locale: ptBR })}
      </div>
      <div className="text-[10px] mb-1">
        {format(date, "dd/MM")}
      </div>
      <div className="space-y-1">
        <div className={`${getStatusColor(shifts.morning)} text-white text-[10px] p-1 rounded-sm`}>
          {getStatusText(shifts.morning)}
        </div>
        <div className={`${getStatusColor(shifts.afternoon)} text-white text-[10px] p-1 rounded-sm`}>
          {getStatusText(shifts.afternoon)}
        </div>
        <div className={`${getStatusColor(shifts.evening)} text-white text-[10px] p-1 rounded-sm`}>
          {getStatusText(shifts.evening)}
        </div>
      </div>
    </div>
  );
};
