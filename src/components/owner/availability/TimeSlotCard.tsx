import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Lock, Clock, AlertCircle, Pencil, X } from "lucide-react";
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
  isPastDate?: boolean;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  turno,
  price,
  isBooked,
  isManuallyClosed,
  onPriceEdit,
  onManualClose,
  onRelease,
  onViewBooking,
  isPastDate = false
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(price.toString());
  const [animatePrice, setAnimatePrice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const lastPriceRef = useRef<number>(price);

  useEffect(() => {
    if (lastPriceRef.current !== price) {
      debugAreaLog('PRICE_EDIT', 'Price prop updated:', price);
      setPriceValue(price.toString());
      lastPriceRef.current = price;
    }
  }, [price]);

  useEffect(() => {
    if (isEditingPrice && inputRef.current) {
      debugAreaLog('PRICE_EDIT', 'Edit mode changed:', isEditingPrice);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingPrice]);

  const formatToCurrency = (value: string): string => {
    const numericValue = value.replace(/\D/g, '');
    const numberValue = parseInt(numericValue) / 100;
    return numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setPriceValue(rawValue);
  };

  const handlePriceSubmit = () => {
    const newPrice = parseInt(priceValue) / 100;
    debugAreaLog('PRICE_EDIT', 'Submitting price:', newPrice);
    
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceEdit(newPrice);
      setAnimatePrice(true);
      setTimeout(() => setAnimatePrice(false), 700);
    } else {
      debugAreaLog('PRICE_EDIT', 'Invalid price, resetting:', priceValue);
      setPriceValue(lastPriceRef.current.toString());
    }
    setIsEditingPrice(false);
  };

  const adjustPrice = (increment: boolean) => {
    const currentPrice = parseFloat(priceValue);
    debugAreaLog('PRICE_EDIT', 'Adjusting price:', { currentPrice, increment });
    
    if (!isNaN(currentPrice)) {
      const step = 5;
      const newPrice = increment ? currentPrice + step : currentPrice - step;
      
      if (newPrice > 0) {
        debugAreaLog('PRICE_EDIT', 'New price after adjustment:', newPrice);
        setPriceValue(newPrice.toString());
        onPriceEdit(newPrice);
        setAnimatePrice(true);
        setTimeout(() => setAnimatePrice(false), 700);
      }
    }
  };

  const getStatusColor = () => {
    if (isPastDate) {
      if (isBooked) return "bg-blue-400";
      if (isManuallyClosed) return "bg-gray-400";
      return "bg-red-400";
    }
    if (isBooked) return "bg-red-500";
    if (isManuallyClosed) return "bg-yellow-300";
    return "bg-green-500";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isBooked && onViewBooking && !isPastDate) {
      onViewBooking();
    }
  };

  const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation();
    callback();
  };

  return (
    <div 
      className={cn(
        "p-2 rounded-lg shadow-sm transition-colors",
        getStatusColor(),
        isBooked && !isPastDate ? "cursor-pointer" : "",
        isPastDate ? "opacity-90" : ""
      )} 
      onClick={handleCardClick}
    >
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium text-white">{turno}</div>
        
        <div className="flex items-center justify-center gap-2 mb-1">
          {isEditingPrice && !isPastDate ? (
            <div className="flex items-center gap-2 justify-center w-full">
              <Input
                ref={inputRef}
                type="text"
                value={formatToCurrency(priceValue)}
                onChange={handlePriceInputChange}
                className="w-24 h-7 text-xs text-black py-1 border border-white/50 focus:border-white transition-all text-center"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePriceSubmit();
                  }}
                  className="h-7 w-7 p-0 hover:bg-green-600/20 rounded-full transition-all flex items-center justify-center"
                >
                  <Check className="h-4 w-4 text-white hover:text-green-400 transition-colors" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPriceValue(price.toString());
                    setIsEditingPrice(false);
                  }}
                  className="h-7 w-7 p-0 hover:bg-red-600/20 rounded-full transition-all flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-white hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 w-full">
              <div className="flex items-center justify-center gap-1 w-full">
                <span className={cn(
                  "text-white text-sm transition-all",
                  animatePrice && "animate-bounce text-yellow-200 font-bold"
                )}>
                  {parseFloat(price).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {isPastDate ? (
          <div className="flex items-center gap-1 text-white text-xs">
            {isBooked ? (
              <>
                <Lock className="w-3 h-3" />
                <span>Alugada</span>
              </>
            ) : isManuallyClosed ? (
              <>
                <Clock className="w-3 h-3" />
                <span>Fechada</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                <span>Não utilizada</span>
              </>
            )}
          </div>
        ) : isBooked ? (
          <div className="flex items-center gap-1 text-white text-xs">
            <Lock className="w-3 h-3" />
            <span>Reservado</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            {!isEditingPrice && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingPrice(true);
                }}
                className="text-xs h-6 py-0 bg-white hover:bg-gray-100 text-gray-800 w-full"
              >
                Editar Preço
              </Button>
            )}
            
            <div className="flex gap-1 w-full">
              {isManuallyClosed ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, onRelease)}
                  className="text-xs h-6 py-0 w-full"
                >
                  Liberar
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, onManualClose)}
                  className="text-xs h-6 py-0 w-full"
                >
                  Fechar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
