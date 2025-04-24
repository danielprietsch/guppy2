
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Lock, Pencil, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { debugLog, debugAreaLog } from "@/utils/debugLogger";

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

  useEffect(() => {
    debugAreaLog('PRICE_EDIT', 'Price prop updated:', price);
    setPriceValue(price.toString());
  }, [price]);

  useEffect(() => {
    debugAreaLog('PRICE_EDIT', 'Edit mode changed:', isEditingPrice);
    if (isEditingPrice && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debugAreaLog('PRICE_EDIT', 'Price input changed:', e.target.value);
    setPriceValue(e.target.value);
  };

  const handlePriceSubmit = () => {
    const newPrice = parseFloat(priceValue);
    debugAreaLog('PRICE_EDIT', 'Submitting price:', newPrice);
    
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceEdit(newPrice);
      setAnimatePrice(true);
      setTimeout(() => setAnimatePrice(false), 700);
    } else {
      debugAreaLog('PRICE_EDIT', 'Invalid price, resetting:', priceValue);
      setPriceValue(price.toString());
    }
    setIsEditingPrice(false);
  };

  const adjustPrice = (increment: boolean) => {
    const currentPrice = parseFloat(priceValue);
    debugAreaLog('PRICE_EDIT', 'Adjusting price:', { currentPrice, increment });
    
    if (!isNaN(currentPrice)) {
      const step = 5; // Ajuste de R$5 por clique
      const newPrice = increment ? currentPrice + step : currentPrice - step;
      
      if (newPrice > 0) {
        debugAreaLog('PRICE_EDIT', 'New price after adjustment:', newPrice);
        setPriceValue(newPrice.toString());
        onPriceEdit(newPrice); // Aplica diretamente o preço ajustado
        setAnimatePrice(true);
        setTimeout(() => setAnimatePrice(false), 700);
      }
    }
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
            <div className="relative flex items-center gap-1">
              <Input
                ref={inputRef}
                type="number"
                value={priceValue}
                onChange={handlePriceChange}
                onBlur={handlePriceSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceSubmit()}
                className="w-20 h-7 text-xs text-black py-1 border border-white/50 focus:border-white transition-all"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustPrice(true);
                  }}
                  className="h-4 w-4 p-0 hover:bg-white/20 rounded transition-all flex items-center justify-center"
                >
                  <ArrowUp className="h-3 w-3 text-white hover:text-yellow-200" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    adjustPrice(false);
                  }}
                  className="h-4 w-4 p-0 hover:bg-white/20 rounded transition-all flex items-center justify-center"
                >
                  <ArrowDown className="h-3 w-3 text-white hover:text-yellow-200" />
                </button>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePriceSubmit();
                }}
                className="h-7 w-7 p-0 hover:bg-white/20 rounded-full transition-all flex items-center justify-center"
              >
                <Check className="h-4 w-4 text-green-600 hover:text-green-400 transition-colors" />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    debugAreaLog('PRICE_EDIT', 'Entering edit mode');
                    setIsEditingPrice(true);
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                onManualClose();
              }}
              className="text-xs h-6 py-0 flex-1"
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
