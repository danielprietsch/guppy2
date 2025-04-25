
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { BookingConfirmationDialog } from "./BookingConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { debugBooking } from "@/utils/debugLogger";

interface ShiftAvailability {
  totalCabins: number;
  availableCabins: number;
  manuallyClosedCount: number;
  price?: number;
  isReserved?: boolean;
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
  const [shiftData, setShiftData] = useState(shifts);
  const isPastDate = isBefore(date, startOfDay(new Date()));
  
  // Check for existing bookings when the component mounts or cabin ID changes
  useEffect(() => {
    if (cabinId) {
      const checkBookings = async () => {
        const formattedDate = format(date, "yyyy-MM-dd");
        const { data, error } = await supabase
          .from('bookings')
          .select('shift')
          .eq('cabin_id', cabinId)
          .eq('date', formattedDate);
        
        if (error) {
          console.error("Error checking bookings:", error);
          return;
        }
        
        if (data && data.length > 0) {
          debugBooking(`Found ${data.length} bookings for cabin ${cabinId} on ${formattedDate}`);
          const updatedShifts = { ...shifts };
          
          // Mark shifts as reserved if they have bookings
          data.forEach(booking => {
            const shift = booking.shift as keyof typeof updatedShifts;
            if (updatedShifts[shift]) {
              updatedShifts[shift] = {
                ...updatedShifts[shift],
                isReserved: true,
                availableCabins: 0 // Force availability to zero when reserved
              };
            }
          });
          
          setShiftData(updatedShifts);
        }
      };
      
      checkBookings();
    }
  }, [cabinId, date, shifts]);

  const getStatusColor = (shift: ShiftAvailability) => {
    if (isPastDate) return "bg-gray-400";
    if (shift.manuallyClosedCount === shift.totalCabins) {
      return "bg-yellow-500";
    }
    // Check explicitly for reservations first
    if (shift.isReserved) {
      return "bg-red-500";
    }
    // Then check for general availability
    return (shift.availableCabins > 0 && shift.totalCabins > 0) ? "bg-green-500" : "bg-red-500";
  };

  const getStatusText = (shift: ShiftAvailability) => {
    if (isPastDate) return "Indisponível";
    if (shift.manuallyClosedCount === shift.totalCabins) {
      return "Fechado";
    }
    // Explicitly check for reservations
    if (shift.isReserved) {
      return "Reservado";
    }
    // Return "Reservado" if no cabins are available or if there are no cabins at all
    if (shift.availableCabins <= 0 || shift.totalCabins <= 0) {
      return "Reservado";
    }
    return `${shift.availableCabins} livre${shift.availableCabins > 1 ? 's' : ''}`;
  };

  const handleShiftClick = (shift: ShiftAvailability) => {
    // Only allow clicking if there are actually available cabins and not reserved
    if (shift.availableCabins > 0 && shift.totalCabins > 0 && !shift.isReserved && cabinId && !isPastDate) {
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
          {shiftData.morning.price !== undefined && (
            <div className="text-xs font-medium text-center -mb-0.5">
              {formatPrice(shiftData.morning.price)}
            </div>
          )}
          <div 
            className={`${getStatusColor(shiftData.morning)} text-white text-xs p-1 rounded-sm shadow-sm ${isPastDate ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleShiftClick(shiftData.morning)}
          >
            {getStatusText(shiftData.morning)}
          </div>
        </div>
        
        <div className="flex flex-col">
          {shiftData.afternoon.price !== undefined && (
            <div className="text-xs font-medium text-center -mb-0.5">
              {formatPrice(shiftData.afternoon.price)}
            </div>
          )}
          <div 
            className={`${getStatusColor(shiftData.afternoon)} text-white text-xs p-1 rounded-sm shadow-sm ${isPastDate ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleShiftClick(shiftData.afternoon)}
          >
            {getStatusText(shiftData.afternoon)}
          </div>
        </div>
        
        <div className="flex flex-col">
          {shiftData.evening.price !== undefined && (
            <div className="text-xs font-medium text-center -mb-0.5">
              {formatPrice(shiftData.evening.price)}
            </div>
          )}
          <div 
            className={`${getStatusColor(shiftData.evening)} text-white text-xs p-1 rounded-sm shadow-sm ${isPastDate ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => handleShiftClick(shiftData.evening)}
          >
            {getStatusText(shiftData.evening)}
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
