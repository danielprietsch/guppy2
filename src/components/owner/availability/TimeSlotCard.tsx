
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Clock, AlertCircle, Edit, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { debugAreaLog } from "@/utils/debugLogger";
import { format, isToday, isBefore, startOfDay } from 'date-fns';

interface TimeSlotCardProps {
  turno: string;
  price: number;
  isBooked: boolean;
  isManuallyClosed: boolean;
  onPriceEdit: (newPrice: string) => void;
  onManualClose: () => void;
  onRelease: () => void;
  onViewBooking?: () => void;
  isPastDate?: boolean;
  date: Date;
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
  isPastDate = false,
  date
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(price.toString());
  
  const handlePriceSubmit = () => {
    const numericPrice = parseFloat(priceValue);
    if (!isNaN(numericPrice) && numericPrice >= 0) {
      onPriceEdit(numericPrice.toFixed(2));
    }
    setIsEditingPrice(false);
  };

  const adjustPrice = (increment: boolean) => {
    const currentPrice = parseFloat(priceValue);
    if (!isNaN(currentPrice)) {
      const step = 10;
      const newPrice = increment ? currentPrice + step : Math.max(0, currentPrice - step);
      setPriceValue(newPrice.toString());
      onPriceEdit(newPrice.toFixed(2));
    }
  };

  const getStatusColor = () => {
    if (isBefore(date, startOfDay(new Date())) && !isToday(date)) {
      if (isBooked) return "bg-blue-400";
      if (isManuallyClosed) return "bg-gray-400";
      return "bg-red-400";
    }
    if (isBooked) return "bg-red-500";
    if (isManuallyClosed) return "bg-yellow-300";
    return "bg-green-500";
  };

  const getTextColor = () => {
    const status = getStatusColor();
    return status === "bg-yellow-300" ? "text-black" : "text-white";
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isBooked && onViewBooking && !isPastDate) {
      onViewBooking();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(value);
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
        <div className={cn("text-sm font-medium", getTextColor())}>{turno}</div>
        
        {isPastDate ? (
          <div className={cn("flex items-center gap-1 text-xs", getTextColor())}>
            {isBooked ? (
              <>
                <Lock className={`w-3 h-3 ${getTextColor()}`} />
                <span>Alugada</span>
              </>
            ) : isManuallyClosed ? (
              <>
                <Clock className={`w-3 h-3 ${getTextColor()}`} />
                <span>Fechada</span>
              </>
            ) : (
              <>
                <AlertCircle className={`w-3 h-3 ${getTextColor()}`} />
                <span>Não utilizada</span>
              </>
            )}
          </div>
        ) : isBooked ? (
          <div className={cn("flex items-center gap-1 text-xs", getTextColor())}>
            <Lock className={`w-3 h-3 ${getTextColor()}`} />
            <span>Reservado</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 w-full">
            {!isManuallyClosed && (
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={cn("text-xs", getTextColor())}>{formatCurrency(price)}</span>
                <div className="flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      adjustPrice(false);
                    }}
                    className="h-5 w-5 p-0"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      adjustPrice(true);
                    }}
                    className="h-5 w-5 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingPrice(true);
                    }}
                    className="h-5 w-5 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {isEditingPrice && (
              <div className="flex gap-1 mt-1">
                <Input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="h-6 text-xs"
                  onClick={(e) => e.stopPropagation()}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handlePriceSubmit();
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePriceSubmit();
                  }}
                  className="h-6 text-xs px-2"
                >
                  OK
                </Button>
              </div>
            )}
            <div className="flex gap-1 w-full">
              {isManuallyClosed ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRelease();
                  }}
                  className={cn(
                    "text-xs h-6 py-0 w-full bg-green-500 hover:bg-green-600 text-white"
                  )}
                >
                  Liberar
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManualClose();
                  }}
                  className={cn(
                    "text-xs h-6 py-0 w-full bg-yellow-300 hover:bg-yellow-400 text-black"
                  )}
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
