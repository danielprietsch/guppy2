
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Lock, Pencil } from "lucide-react";
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
  const [animatePrice, setAnimatePrice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local price when prop changes
  useEffect(() => {
    setPriceValue(price.toString());
  }, [price]);

  useEffect(() => {
    if (isEditingPrice && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceValue(e.target.value);
  };

  const handlePriceSubmit = () => {
    const newPrice = parseFloat(priceValue);
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceEdit(newPrice);
      // Animate price after update
      setAnimatePrice(true);
      setTimeout(() => setAnimatePrice(false), 700);
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

  const handleEditButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingPrice(true);
  };

  const handleManualCloseButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onManualClose();
  };

  const handleReleaseButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRelease();
  };

  return (
    <div 
      className={cn(
        "p-2 rounded-lg shadow-sm transition-colors",
        getStatusColor(),
        isBooked ? "cursor-pointer" : ""
      )} 
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-white">{turno}</div>
        
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-sm">R$</span>
          {isEditingPrice ? (
            <div className="relative">
              <Input
                ref={inputRef}
                type="number"
                value={priceValue}
                onChange={handlePriceChange}
                onBlur={handlePriceSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceSubmit()}
                onClick={(e) => e.stopPropagation()}
                className="w-16 h-7 text-xs text-black pr-6 py-1 border border-white/50 focus:border-white transition-all"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePriceSubmit();
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0 hover:bg-white/20 rounded-full transition-all flex items-center justify-center"
              >
                <Check className="h-3 w-3 text-green-600 hover:text-green-400 transition-colors" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-white text-sm transition-all",
                animatePrice && "animate-bounce text-yellow-200 font-bold"
              )}>
                {parseFloat(price.toString()).toFixed(2)}
              </span>
              {!isBooked && (
                <button
                  type="button"
                  className="h-5 w-5 p-0 hover:bg-white/20 rounded-full transition-all flex items-center justify-center"
                  onClick={handleEditButtonClick}
                >
                  <Pencil className="h-3 w-3 text-white hover:text-yellow-200 transition-colors" />
                </button>
              )}
            </div>
          )}
        </div>

        {isBooked ? (
          <div className="flex items-center gap-1 text-white text-xs">
            <Lock className="w-3 h-3" />
            <span>Reservado</span>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              variant={isManuallyClosed ? "secondary" : "default"}
              size="sm"
              onClick={handleManualCloseButtonClick}
              className="text-xs h-6 py-0 flex-1"
            >
              {isManuallyClosed ? "Fechado" : "Fechar"}
            </Button>
            <Button
              variant={isManuallyClosed ? "default" : "secondary"}
              size="sm"
              onClick={handleReleaseButtonClick}
              className="text-xs h-6 py-0 flex-1"
            >
              Liberar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
