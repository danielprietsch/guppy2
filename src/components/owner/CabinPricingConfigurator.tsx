
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, CalendarCheck, Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Turno = "morning" | "afternoon" | "evening";

interface PrecoPorTurno {
  morning: number;
  afternoon: number;
  evening: number;
  availability?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

interface PrecosPorDia {
  [date: string]: PrecoPorTurno;
}

interface PrecosPorDiaSemana {
  0: PrecoPorTurno; // Domingo
  1: PrecoPorTurno;
  2: PrecoPorTurno;
  3: PrecoPorTurno;
  4: PrecoPorTurno;
  5: PrecoPorTurno;
  6: PrecoPorTurno; // Sábado
}

interface CabinPricingConfiguratorProps {
  precosPorDia: PrecosPorDia;
  setPrecosPorDia: React.Dispatch<React.SetStateAction<PrecosPorDia>>;
  precosPorDiaSemana: PrecosPorDiaSemana;
  setPrecosPorDiaSemana: React.Dispatch<React.SetStateAction<PrecosPorDiaSemana>>;
  valorDiasUteis: string;
  setValorDiasUteis: React.Dispatch<React.SetStateAction<string>>;
  valorFimSemana: string;
  setValorFimSemana: React.Dispatch<React.SetStateAction<string>>;
  turnoInputs: { [key in Turno]: string };
  setTurnoInputs: React.Dispatch<React.SetStateAction<{ [key in Turno]: string }>>;
  turnoDisponibilidade: { [key in Turno]: boolean };
  setTurnoDisponibilidade: React.Dispatch<React.SetStateAction<{ [key in Turno]: boolean }>>;
  selectedDate: Date | undefined;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

const TURNOS: { key: Turno; label: string }[] = [
  { key: "morning", label: "Manhã" },
  { key: "afternoon", label: "Tarde" },
  { key: "evening", label: "Noite" }
];

const DIAS_SEMANA = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

export const CabinPricingConfigurator: React.FC<CabinPricingConfiguratorProps> = ({
  precosPorDia,
  setPrecosPorDia,
  precosPorDiaSemana,
  setPrecosPorDiaSemana,
  valorDiasUteis,
  setValorDiasUteis,
  valorFimSemana,
  setValorFimSemana,
  turnoInputs,
  setTurnoInputs,
  turnoDisponibilidade,
  setTurnoDisponibilidade,
  selectedDate,
  setSelectedDate,
  activeTab,
  setActiveTab
}) => {
  // Add price for a specific date
  const handleAddPriceByDay = () => {
    if (!selectedDate) {
      toast({ title: "Selecione uma data!", variant: "destructive" });
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const novosPrecos = { ...precosPorDia };

    // Check for at least one price
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

  // Update shift input
  const handleTurnoInputChange = (turno: Turno, value: string) => {
    setTurnoInputs({
      ...turnoInputs,
      [turno]: value.replace(/[^\d.]/g, "")
    });
  };

  // Update availability for a shift
  const handleTurnoDisponibilidadeChange = (turno: Turno, checked: boolean) => {
    setTurnoDisponibilidade({
      ...turnoDisponibilidade,
      [turno]: checked
    });
  };

  // Set default prices for weekdays and weekends
  const handleApplyDefaultPrices = () => {
    const valorUteis = parseFloat(valorDiasUteis);
    const valorFim = parseFloat(valorFimSemana);

    if (isNaN(valorUteis) || isNaN(valorFim)) {
      toast({ title: "Valores inválidos", description: "Verifique os valores informados", variant: "destructive" });
      return;
    }

    const novosPrecos: PrecosPorDiaSemana = { ...precosPorDiaSemana };
    for (let i = 1; i <= 5; i++) {
      novosPrecos[i as keyof PrecosPorDiaSemana] = {
        morning: valorUteis,
        afternoon: valorUteis,
        evening: valorUteis
      };
    }
    novosPrecos[0] = { morning: valorFim, afternoon: valorFim, evening: valorFim };
    novosPrecos[6] = { morning: valorFim, afternoon: valorFim, evening: valorFim };
    setPrecosPorDiaSemana(novosPrecos);
    toast({ title: "Preços padrão definidos", description: "Os preços padrão foram atualizados" });
  };

  // Remove a specific date's pricing
  const handleRemoveDate = (date: string) => {
    const novosPrecos = { ...precosPorDia };
    delete novosPrecos[date];
    setPrecosPorDia(novosPrecos);
  };

  // Display pricing for specific dates
  const renderPrecos = () => {
    if (Object.keys(precosPorDia).length === 0) {
      return <span className="text-muted-foreground text-xs">Nenhum preço específico definido</span>;
    }
    return Object.entries(precosPorDia).map(([date, turnos]) => (
      <div key={date} className="mb-2 border-b pb-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold">{format(new Date(date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}</span>
          <button type="button" onClick={() => handleRemoveDate(date)} className="ml-1 hover:text-destructive">
            <Trash className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 ml-2 mt-1 mb-1">
          {TURNOS.map(turno => {
            const disponivel = turnos.availability?.[turno.key] !== false;
            return (
              <span
                key={turno.key}
                className={`px-2 py-0.5 rounded text-xs ${
                  disponivel
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-destructive text-destructive-foreground'
                }`}
              >
                {turno.label}: {disponivel ? `R$ ${turnos[turno.key].toFixed(2)}` : 'Indisponível'}
              </span>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <div>
      <Tabs defaultValue="padrao" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="padrao">Preços Padrão</TabsTrigger>
          <TabsTrigger value="individual">Datas Específicas</TabsTrigger>
        </TabsList>

        <TabsContent value="padrao" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Dias úteis (Segunda a Sexta)</Label>
                    <div className="flex items-center mt-1">
                      <span className="mr-2">R$</span>
                      <Input
                        value={valorDiasUteis}
                        onChange={(e) => setValorDiasUteis(e.target.value.replace(/[^\d.]/g, ""))}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Finais de semana (Sábado e Domingo)</Label>
                    <div className="flex items-center mt-1">
                      <span className="mr-2">R$</span>
                      <Input
                        value={valorFimSemana}
                        onChange={(e) => setValorFimSemana(e.target.value.replace(/[^\d.]/g, ""))}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleApplyDefaultPrices}
                  className="w-full"
                >
                  Aplicar Preços Padrão
                </Button>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Preços por dia da semana:</h4>
                  <div className="space-y-2">
                    {DIAS_SEMANA.map((dia, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b">
                        <span className="font-medium">{dia}</span>
                        <div className="flex gap-2">
                          {TURNOS.map(turno => (
                            <div key={turno.key} className="text-xs flex items-center">
                              <span className="mr-1">{turno.label}:</span>
                              <span className="font-medium">
                                R$ {precosPorDiaSemana[index as keyof PrecosPorDiaSemana][turno.key].toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/2">
                  <Label className="mb-2 block">Selecionar data</Label>
                  <div className="mb-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
