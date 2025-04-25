
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShiftStatus } from '@/hooks/useAvailability';

interface DayShiftStatusProps {
  date: Date;
  shift: 'morning' | 'afternoon' | 'evening';
  status: ShiftStatus;
  onStatusChange: (status: ShiftStatus) => void;
}

const DayShiftStatus = ({ date: date, shift, status, onStatusChange }: DayShiftStatusProps) => {
  const statusColors = {
    free: 'bg-green-100 hover:bg-green-200',
    busy: 'bg-red-100 hover:bg-red-200',
    closed: 'bg-amber-100 hover:bg-amber-200'
  };

  const statusLabels = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite'
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{statusLabels[shift]}</span>
      <div className="flex gap-2">
        {(['free', 'busy', 'closed'] as ShiftStatus[]).map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className={`${statusColors[s]} ${status === s ? 'ring-2 ring-primary' : ''}`}
            onClick={() => onStatusChange(s)}
          >
            {s === 'free' ? 'Livre' : s === 'busy' ? 'Ocupado' : 'Fechado'}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DayShiftStatus;
