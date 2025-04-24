
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Pencil } from "lucide-react";
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
            <div className="relative">
              <Input
                ref={inputRef}
                type="number"
                value={priceValue}
                onChange={handlePriceChange}
                onBlur={handlePriceSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceSubmit()}
                onClick={(e) => e.stopPropagation()}
                className="w-24 text-black pr-8 border-2 border-white/50 focus:border-white focus:ring-2 focus:ring-white/30 transition-all"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 pointer-events-none rounded-md"></div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-white transition-all",
                animatePrice && "animate-bounce text-yellow-200 font-bold"
              )}>
                {parseFloat(price.toString()).toFixed(2)}
              </span>
              {!isBooked && !isManuallyClosed && (
                <button
                  type="button"
                  className="h-6 w-6 p-0 hover:bg-white/20 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                  onClick={handleEditButtonClick}
                >
                  <Pencil className="h-4 w-4 text-white hover:text-yellow-200 transition-colors" />
                </button>
              )}
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
