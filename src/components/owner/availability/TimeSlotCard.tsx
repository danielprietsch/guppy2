
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Lock, Clock, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { debugAreaLog } from "@/utils/debugLogger";
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import { toast } from "@/hooks/use-toast";

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
    const newPrice = parseFloat(priceValue) / 100;
    debugAreaLog('PRICE_EDIT', 'Submitting price:', newPrice);
    
    if (!isNaN(newPrice) && newPrice > 0) {
      onPriceEdit(newPrice.toFixed(2));
      setAnimatePrice(true);
      setTimeout(() => setAnimatePrice(false), 700);
    } else {
      debugAreaLog('PRICE_EDIT', 'Invalid price, resetting:', priceValue);
      setPriceValue(lastPriceRef.current.toString());
    }
    setIsEditingPrice(false);
  };

  const adjustPrice = (increment: boolean) => {
    const currentPrice = parseFloat(priceValue) || 0;
    debugAreaLog('PRICE_EDIT', 'Adjusting price:', { currentPrice, increment });
    
    if (!isNaN(currentPrice)) {
      const step = 5;
      const newPrice = increment ? currentPrice + step : currentPrice - step;
      
      if (newPrice > 0) {
        debugAreaLog('PRICE_EDIT', 'New price after adjustment:', newPrice);
        
        const formattedPrice = (newPrice / 100).toFixed(2);
        onPriceEdit(formattedPrice);
        
        setPriceValue(newPrice.toString());
        
        setAnimatePrice(true);
        setTimeout(() => setAnimatePrice(false), 700);
      }
    }
  };

  const canCloseTimeSlot = () => {
    // Corrigindo: Essa função não deve levar em conta a data, apenas a hora
    // A verificação de "hoje" já é feita antes de chamar essa função
    debugAreaLog('TIME_CLOSURE', `Verificando horário para fechamento - Turno: ${turno}, Hora atual: ${new Date().getHours()}`);
    
    const now = new Date();
    const currentHour = now.getHours();
    
    switch(turno.toLowerCase()) {
      case 'manhã':
        return currentHour < 12;
      case 'tarde':
        return currentHour < 17;
      case 'noite':
        return currentHour < 22;
      default:
        return true;
    }
  };

  const handleManualClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    debugAreaLog('TIME_CLOSURE', `Tentando fechar - Data: ${format(date, 'yyyy-MM-dd')}, Turno: ${turno}`);
    
    // Removendo a verificação que impede o fechamento no dia atual
    // O fechamento deve ser permitido baseado apenas na hora, não na data
    if (!canCloseTimeSlot()) {
      toast({
        title: "Não é possível fechar este turno",
        description: "O horário limite para fechamento deste turno já passou.",
        variant: "destructive"
      });
      return;
    }
    
    onManualClose();
  };

  const getStatusColor = () => {
    // Only consider dates before today as past dates
    // The current day should not be considered a past date
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
            <div className="flex gap-1 w-full">
              {isManuallyClosed ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, onRelease)}
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
                  onClick={handleManualClose}
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
