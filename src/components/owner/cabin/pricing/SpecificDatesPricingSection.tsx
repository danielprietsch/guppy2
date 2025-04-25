import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, CalendarCheck, Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PrecosPorDia, TurnoInputs, TurnoDisponibilidade } from "../cabinUtils";

interface SpecificDatesPricingSectionProps {
  precosPorDia: PrecosPorDia;
  setPrecosPorDia: React.Dispatch<React.SetStateAction<PrecosPorDia>>;
  selectedDate: Date | undefined;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  turnoInputs: TurnoInputs;
  setTurnoInputs: React.Dispatch<React.SetStateAction<TurnoInputs>>;
  turnoDisponibilidade: TurnoDisponibilidade;
  setTurnoDisponibilidade: React.Dispatch<React.SetStateAction<TurnoDisponibilidade>>;
}

const TURNOS = [
  { key: "morning" as const, label: "Manhã" },
  { key: "afternoon" as const, label: "Tarde" },
  { key: "evening" as const, label: "Noite" }
];

export const SpecificDatesPricingSection: React.FC<SpecificDatesPricingSectionProps> = ({
  precosPorDia,
  setPrecosPorDia,
  selectedDate,
  setSelectedDate,
  turnoInputs,
  setTurnoInputs,
  turnoDisponibilidade,
  setTurnoDisponibilidade,
}) => {
  const handleTurnoInputChange = (turno: keyof TurnoInputs, value: string) => {
    setTurnoInputs({
      ...turnoInputs,
      [turno]: value.replace(/[^\d.]/g, "")
    });
  };

  const handleTurnoDisponibilidadeChange = (turno: keyof TurnoDisponibilidade, checked: boolean) => {
    setTurnoDisponibilidade({
      ...turnoDisponibilidade,
      [turno]: checked
    });
  };

  const handleRemoveDate = (date: string) => {
    const novosPrecos = { ...precosPorDia };
    delete novosPrecos[date];
    setPrecosPorDia(novosPrecos);
  };

  const handleAddPriceByDay = () => {
    if (!selectedDate) {
      toast({ title: "Selecione uma data!", variant: "destructive" });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const novosPrecos = { ...precosPorDia };

    const hasValue = Object.values(turnoInputs).some(val => val.trim() !== "");

    if (!hasValue) {
      toast({ title: "Defina pelo menos um preço para algum turno!", variant: "destructive" });
      return;
    }

    if (!novosPrecos[dateStr]) {
      novosPrecos[dateStr] = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        availability: {
          morning: turnoDisponibilidade.morning,
          afternoon: turnoDisponibilidade.afternoon,
          evening: turnoDisponibilidade.evening
        }
      };
    }

    TURNOS.forEach(turno => {
      const valor = parseFloat(turnoInputs[turno.key]);
      if (!isNaN(valor) && valor > 0) {
        novosPrecos[dateStr][turno.key] = valor;
      }
      if (novosPrecos[dateStr].availability) {
        novosPrecos[dateStr].availability![turno.key] = turnoDisponibilidade[turno.key];
      }
    });

    setPrecosPorDia(novosPrecos);
    setSelectedDate(undefined);
    setTurnoInputs({ morning: "", afternoon: "", evening: "" });
    setTurnoDisponibilidade({ morning: true, afternoon: true, evening: true });
    
    toast({ title: "Preços definidos!", description: `Preços atualizados para ${format(selectedDate, "dd/MM/yyyy")}` });
  };

  const renderPrecos = () => {
    if (Object.keys(precosPorDia).length === 0) {
      return <span className="text-muted-foreground text-xs">Nenhum preço específico definido</span>;
    }

    return Object.entries(precosPorDia).map(([date, turnos]) => (
      <div key={date} className="mb-2 border-b pb-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold">
            {format(new Date(date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
          </span>
          <button 
            type="button" 
            onClick={() => handleRemoveDate(date)} 
            className="ml-1 hover:text-destructive"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 ml-2 mt-1 mb-1">
          {TURNOS.map(turno => {
            const disponivel = turnos.availability?.[turno.key] !== false;
            const price = turnos[turno.key];
            const formattedPrice = typeof price === 'number' ? price.toFixed(2) : '0.00';
            
            return (
              <span
                key={turno.key}
                className={`px-2 py-0.5 rounded text-xs ${
                  disponivel
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {turno.label}: {disponivel ? `R$ ${formattedPrice}` : 'Indisponível'}
              </span>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2">
            <Label className="mb-2 block">Selecionar data</Label>
            <div className="mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={ptBR}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              {TURNOS.map(turno => (
                <div key={turno.key} className="flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">{turno.label}</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={turnoDisponibilidade[turno.key]}
                        onCheckedChange={(checked) =>
                          handleTurnoDisponibilidadeChange(turno.key, checked)
                        }
                        disabled={!selectedDate}
                      />
                      <span className="text-xs">
                        {turnoDisponibilidade[turno.key] ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">R$</span>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={turnoInputs[turno.key]}
                      onChange={(e) => handleTurnoInputChange(turno.key, e.target.value)}
                      className="w-24"
                      disabled={!selectedDate || !turnoDisponibilidade[turno.key]}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={handleAddPriceByDay}
              disabled={!selectedDate}
              className="w-full mt-4"
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Definir Preço/Disponibilidade
            </Button>
          </div>
          <div className="md:w-1/2">
            <div className="border rounded-md p-4 h-[320px] overflow-y-auto">
              <h4 className="font-medium mb-2 flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Preços e disponibilidade
              </h4>
              <div className="space-y-1">
                {renderPrecos()}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
