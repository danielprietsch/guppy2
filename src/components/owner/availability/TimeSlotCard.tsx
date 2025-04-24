
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlotCardProps {
  turno: string;
  price: number;
  isBooked: boolean;
  isManuallyClosed: boolean;
  onPriceEdit: (newPrice: number) => void;
  onManualClose: () => void;
  onRelease: () => void;
  onViewBooking?: () => void;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  turno,
  price,
  isBooked,
  isManuallyClosed,
  onPriceEdit,
  onManualClose,
  onRelease,
  onViewBooking
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(price.toString());

  // Update local price when prop changes
  React.useEffect(() => {
    setPriceValue(price.toString());
  }, [price]);

  const handlePriceDoubleClick = () => {
    if (!isBooked && !isManuallyClosed) {
      setIsEditingPrice(true);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(e.target.value);
  };

  const handlePriceSubmit = () => {
    const newPrice = parseFloat(priceValue);
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceEdit(newPrice);
    } else {
      // Reset to original price if invalid
      setPriceValue(price.toString());
    }
    setIsEditingPrice(false);
  };

  const getStatusColor = () => {
    if (isBooked) return "bg-red-500";
    if (isManuallyClosed) return "bg-yellow-300";
    return "bg-green-500";
  };

  const handleCardClick = () => {
    if (isBooked && onViewBooking) {
      onViewBooking();
    }
  };

  return (
    <div 
      className={cn(
        "p-4 rounded-lg shadow-sm transition-colors",
        getStatusColor(),
        isBooked ? "cursor-pointer" : ""
      )} 
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-2">
        <div className="text-lg font-medium text-white">{turno}</div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white">R$</span>
          {isEditingPrice ? (
            <Input
              type="number"
              value={priceValue}
              onChange={handlePriceChange}
              onBlur={handlePriceSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceSubmit()}
              onClick={(e) => e.stopPropagation()} // Prevent card click when editing
              autoFocus
              className="w-24 text-black"
            />
          ) : (
            <div
              onDoubleClick={handlePriceDoubleClick}
              className="cursor-text text-white"
            >
              {parseFloat(price.toString()).toFixed(2)}
            </div>
          )}
        </div>

        {isBooked ? (
          <div className="flex items-center gap-2 text-white">
            <Lock className="w-4 h-4" />
            <span>Reservado</span>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant={isManuallyClosed ? "secondary" : "default"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onManualClose();
              }}
              className="flex-1"
            >
              {isManuallyClosed ? "Fechado" : "Fechar"}
            </Button>
            <Button
              variant={isManuallyClosed ? "default" : "secondary"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRelease();
              }}
              className="flex-1"
            >
              Liberar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
