
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useAuth } from "@/lib/auth";

type ShiftStatus = 'free' | 'busy' | 'closed';

interface DayAvailability {
  date: Date;
  morning: ShiftStatus;
  afternoon: ShiftStatus;
  evening: ShiftStatus;
}

interface AvailabilityCalendarProps {
  initialAvailability?: DayAvailability[];
}

// Mock data for demonstration
const generateMockAvailability = (startDate: Date, days: number): DayAvailability[] => {
  const availability: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Set Sunday as closed and randomize other days for demonstration
    const isSunday = date.getDay() === 0;
    const isMonday = date.getDay() === 1;
    
    availability.push({
      date: new Date(date),
      morning: isSunday ? 'closed' : isMonday ? 'busy' : Math.random() > 0.3 ? 'free' : 'busy',
      afternoon: isSunday ? 'closed' : Math.random() > 0.5 ? 'free' : 'busy',
      evening: isSunday ? 'closed' : Math.random() > 0.7 ? 'free' : 'busy',
    });
  }
  return availability;
};

// Custom CSS to apply to the calendar day cells
const dayClass = (day: Date, availability: DayAvailability[]) => {
  const dayAvail = availability.find(a => isSameDay(a.date, day));
  if (!dayAvail) return "";
  
  // Count status for visualization
  let freeCount = 0;
  let busyCount = 0;
  let closedCount = 0;
  
  if (dayAvail.morning === 'free') freeCount++;
  if (dayAvail.afternoon === 'free') freeCount++;
  if (dayAvail.evening === 'free') freeCount++;
  
  if (dayAvail.morning === 'busy') busyCount++;
  if (dayAvail.afternoon === 'busy') busyCount++;
  if (dayAvail.evening === 'busy') busyCount++;
  
  if (dayAvail.morning === 'closed') closedCount++;
  if (dayAvail.afternoon === 'closed') closedCount++;
  if (dayAvail.evening === 'closed') closedCount++;
  
  if (closedCount === 3) return "bg-amber-100 text-gray-500";
  if (busyCount === 3) return "bg-red-100 text-gray-500";
  if (freeCount === 3) return "bg-green-100 text-gray-900";
  
  // Mixed availability
  if (freeCount > 0) return "bg-gradient-to-br from-green-100 via-white to-amber-100";
  return "bg-gradient-to-br from-amber-100 via-white to-red-100";
};

const ShiftStatusIndicator = ({ status }: { status: ShiftStatus }) => {
  let bgColor = "bg-gray-200";
  
  switch (status) {
    case 'free':
      bgColor = "bg-green-500";
      break;
    case 'busy':
      bgColor = "bg-red-500";
      break;
    case 'closed':
      bgColor = "bg-amber-500";
      break;
  }
  
  return <div className={`w-4 h-4 rounded-full ${bgColor}`}></div>;
};

const DayDetails = ({ dayAvail }: { dayAvail: DayAvailability }) => {
  return (
    <div className="mt-2 border-t pt-2">
      <p className="font-semibold text-sm mb-2">
        {format(dayAvail.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      </p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Manhã:</span>
          <div className="flex items-center gap-2">
            <ShiftStatusIndicator status={dayAvail.morning} />
            <span>{dayAvail.morning === 'free' ? 'Livre' : dayAvail.morning === 'busy' ? 'Ocupado' : 'Fechado'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Tarde:</span>
          <div className="flex items-center gap-2">
            <ShiftStatusIndicator status={dayAvail.afternoon} />
            <span>{dayAvail.afternoon === 'free' ? 'Livre' : dayAvail.afternoon === 'busy' ? 'Ocupado' : 'Fechado'}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Noite:</span>
          <div className="flex items-center gap-2">
            <ShiftStatusIndicator status={dayAvail.evening} />
            <span>{dayAvail.evening === 'free' ? 'Livre' : dayAvail.evening === 'busy' ? 'Ocupado' : 'Fechado'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AvailabilityCalendar = ({ initialAvailability }: AvailabilityCalendarProps) => {
  const { user } = useAuth();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [availability, setAvailability] = useState<DayAvailability[]>(
    initialAvailability || generateMockAvailability(today, 30)
  );

  const selectedDayAvail = selectedDate 
    ? availability.find(a => isSameDay(a.date, selectedDate))
    : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendário de Disponibilidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="border rounded-md p-3"
              modifiers={{
                booked: (date) => {
                  const dayAvail = availability.find(a => isSameDay(a.date, date));
                  return dayAvail ? dayAvail.morning === 'busy' && dayAvail.afternoon === 'busy' && dayAvail.evening === 'busy' : false;
                },
                available: (date) => {
                  const dayAvail = availability.find(a => isSameDay(a.date, date));
                  return dayAvail ? dayAvail.morning === 'free' && dayAvail.afternoon === 'free' && dayAvail.evening === 'free' : false;
                },
                closed: (date) => {
                  const dayAvail = availability.find(a => isSameDay(a.date, date));
                  return dayAvail ? dayAvail.morning === 'closed' && dayAvail.afternoon === 'closed' && dayAvail.evening === 'closed' : false;
                }
              }}
              modifiersStyles={{
                booked: { backgroundColor: "#FEE2E2" }, // Light red for busy days
                available: { backgroundColor: "#DCFCE7" }, // Light green for free days
                closed: { backgroundColor: "#FEF9C3" }, // Light yellow for closed days
              }}
              components={{
                Day: ({ day, ...props }: React.ComponentProps<typeof Calendar.Day> & { day: Date }) => (
                  <button
                    {...props}
                    className={`${props.className || ''} ${dayClass(day, availability)}`}
                  />
                )
              }}
            />
            
            <div className="mt-4 flex flex-col space-y-2">
              <div className="flex items-center text-sm font-medium space-x-2">
                <div className="w-4 h-4 rounded bg-green-100"></div>
                <span>Totalmente Livre</span>
              </div>
              <div className="flex items-center text-sm font-medium space-x-2">
                <div className="w-4 h-4 rounded bg-red-100"></div>
                <span>Totalmente Ocupado</span>
              </div>
              <div className="flex items-center text-sm font-medium space-x-2">
                <div className="w-4 h-4 rounded bg-amber-100"></div>
                <span>Fechado</span>
              </div>
              <div className="flex items-center text-sm font-medium space-x-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-green-100 via-white to-amber-100"></div>
                <span>Parcialmente Disponível</span>
              </div>
            </div>
          </div>
          
          <div>
            {selectedDayAvail ? (
              <DayDetails dayAvail={selectedDayAvail} />
            ) : (
              <div className="h-full flex items-center justify-center border rounded-md p-6">
                <p className="text-muted-foreground">Selecione um dia para ver detalhes</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailabilityCalendar;
