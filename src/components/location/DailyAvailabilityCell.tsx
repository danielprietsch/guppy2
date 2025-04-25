
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { BookingConfirmationDialog } from "./BookingConfirmationDialog";

interface ShiftAvailability {
  totalCabins: number;
  availableCabins: number;
  manuallyClosedCount: number;
  price?: number;
}

interface DailyAvailabilityCellProps {
  date: Date;
  shifts: {
    morning: ShiftAvailability;
    afternoon: ShiftAvailability;
    evening: ShiftAvailability;
  };
  cabinId?: string;
}

export const DailyAvailabilityCell = ({ date, shifts, cabinId }: DailyAvailabilityCellProps) => {
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const isPastDate = isBefore(date, startOfDay(new Date()));

  const getStatusColor = (shift: ShiftAvailability) => {
    if (isPastDate) return "bg-gray-400";
    if (shift.manuallyClosedCount === shift.totalCabins) {
      return "bg-yellow-500";
    }
    return shift.availableCabins > 0 ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = (shift: ShiftAvailability) => {
    if (isPastDate) return "Indisponível";
    if (shift.manuallyClosedCount === shift.totalCabins) {
      return "Fechado";
    }
    return shift.availableCabins > 0 ? `${shift.availableCabins} livre${shift.availableCabins > 1 ? 's' : ''}` : "Reservado";
  };

  const handleShiftClick = (shift: ShiftAvailability) => {
    if (shift.availableCabins > 0 && cabinId && !isPastDate) {
      setShowBookingDialog(true);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return null;
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="text-sm">
      <div className="font-medium mb-1 text-base">
        {format(date, "EEE", { locale: ptBR })}
      </div>
      <div className="text-sm mb-1">
        {format(date, "dd/MM")}
      </div>
      <div className="space-y-1">
        <div className="flex flex-col">
          {shifts.morning.price !== undefined && (
            <div className="text-xs font-medium text-center -mb-0.5">
              {formatPrice(shifts.morning.price)}
            </div>
          )}
          <div 
            className={`${getStatusColor(shifts.morning)} text-white text-xs p-1 rounded-sm shadow-sm ${isPastDate ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleShiftClick(shifts.morning)}
          >
            {getStatusText(shifts.morning)}
          </div>
        </div>
        
        <div className="flex flex-col">
          {shifts.afternoon.price !== undefined && (
            <div className="text-xs font-medium text-center -mb-0.5">
              {formatPrice(shifts.afternoon.price)}
            </div>
          )}
          <div 
            className={`${getStatusColor(shifts.afternoon)} text-white text-xs p-1 rounded-sm shadow-sm ${isPastDate ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleShiftClick(shifts.afternoon)}
          >
            {getStatusText(shifts.afternoon)}
          </div>
        </div>
        
        <div className="flex flex-col">
          {shifts.evening.price !== undefined && (
            <div className="text-xs font-medium text-center -mb-0.5">
              {formatPrice(shifts.evening.price)}
            </div>
          )}
          <div 
            className={`${getStatusColor(shifts.evening)} text-white text-xs p-1 rounded-sm shadow-sm ${isPastDate ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleShiftClick(shifts.evening)}
          >
            {getStatusText(shifts.evening)}
          </div>
        </div>
      </div>

      {cabinId && (
        <BookingConfirmationDialog
          isOpen={showBookingDialog}
          onClose={() => setShowBookingDialog(false)}
          cabinId={cabinId}
        />
      )}
    </div>
  );
};
