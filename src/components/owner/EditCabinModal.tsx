import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Cabin } from "@/lib/types";
import { CabinEquipmentInput } from "@/components/owner/CabinEquipmentInput";
import { CabinPricingConfigurator } from "./CabinPricingConfigurator";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Json } from "@/integrations/supabase/types";

type Turno = "morning" | "afternoon" | "evening";

interface EditCabinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabin: Cabin;
  onCabinUpdated?: (cabin: Cabin) => void;
}

const TURNOS: { key: Turno; label: string }[] = [
  { key: "morning", label: "Manhã" },
  { key: "afternoon", label: "Tarde" },
  { key: "evening", label: "Noite" }
];

const DIAS_SEMANA = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

export const EditCabinModal: React.FC<EditCabinModalProps> = ({
  open,
  onOpenChange,
  cabin,
  onCabinUpdated
}) => {
  const [name, setName] = React.useState(cabin.name);
  const [description, setDescription] = React.useState(cabin.description);
  const [equipment, setEquipment] = React.useState<string[]>(cabin.equipment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [precosPorDia, setPrecosPorDia] = React.useState<any>(cabin.pricing?.specificDates || {});
  const [activeTab, setActiveTab] = React.useState<string>("padrao");

  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState<any>(cabin.pricing?.defaultPricing || {
    0: { morning: 150, afternoon: 150, evening: 150 },
    1: { morning: 100, afternoon: 100, evening: 100 },
    2: { morning: 100, afternoon: 100, evening: 100 },
    3: { morning: 100, afternoon: 100, evening: 100 },
    4: { morning: 100, afternoon: 100, evening: 100 },
    5: { morning: 100, afternoon: 100, evening: 100 },
    6: { morning: 150, afternoon: 150, evening: 150 },
  });

  const initialValorDiasUteis = (cabDayNum: number) =>
    cabin.pricing?.defaultPricing?.[cabDayNum]
      ? String(cabin.pricing.defaultPricing[cabDayNum].morning || 100)
      : "100";
  const initialValorFimSemana = (cabDayNum: number) =>
    cabin.pricing?.defaultPricing?.[cabDayNum]
      ? String(cabin.pricing.defaultPricing[cabDayNum].morning || 150)
      : "150";

  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>(initialValorDiasUteis(1));
  const [valorFimSemana, setValorFimSemana] = React.useState<string>(initialValorFimSemana(0));

  const [turnoInputs, setTurnoInputs] = React.useState<{ [key in Turno]: string }>({
    morning: "",
    afternoon: "",
    evening: ""
  });

  const [turnoDisponibilidade, setTurnoDisponibilidade] = React.useState<{ [key in Turno]: boolean }>({
    morning: true,
    afternoon: true,
    evening: true
  });

  React.useEffect(() => {
    setName(cabin.name);
    setDescription(cabin.description);
    setEquipment(cabin.equipment);
    if (cabin.pricing?.specificDates) setPrecosPorDia(cabin.pricing.specificDates);
    if (cabin.pricing?.defaultPricing) {
      setPrecosPorDiaSemana(cabin.pricing.defaultPricing);
      setValorDiasUteis(String(cabin.pricing.defaultPricing[1]?.morning || 100));
      setValorFimSemana(String(cabin.pricing.defaultPricing[0]?.morning || 150));
    }
  }, [cabin]);

  const handleUpdatePriceByDay = () => {
    if (!selectedDate) {
      toast({ title: "Selecione uma data!", variant: "destructive" });
      return;
    }
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const novosPrecos = {...precosPorDia};
    
    const hasValue = Object.values(turnoInputs).some(val => val.trim() !== "");
    
    if (!hasValue && !novosPrecos[dateStr]) {
      toast({ title: "Defina pelo menos um preço para algum turno ou marque como indisponível!", variant: "destructive" });
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
    
    if (!novosPrecos[dateStr].availability) {
      novosPrecos[dateStr].availability = {
        morning: true,
        afternoon: true,
        evening: true
      };
    }

    TURNOS.forEach(turno => {
      const valor = parseFloat(turnoInputs[turno.key]);
      if (!isNaN(valor) && valor > 0) {
        novosPrecos[dateStr][turno.key] = valor;
      }
      
      novosPrecos[dateStr].availability[turno.key] = turnoDisponibilidade[turno.key];
    });

    setPrecosPorDia(novosPrecos);
    
    setSelectedDate(undefined);
    setTurnoInputs({morning: "", afternoon: "", evening: ""});
    setTurnoDisponibilidade({morning: true, afternoon: true, evening: true});
    
    toast({ title: "Preços e disponibilidade atualizados!", description: `Atualizados para ${format(selectedDate, "dd/MM/yyyy")}` });
  };

  const handleTurnoInputChange = (turno: Turno, value: string) => {
    setTurnoInputs({
      ...turnoInputs,
      [turno]: value.replace(/[^\d.]/g, "")
    });
  };

  const handleTurnoDisponibilidadeChange = (turno: Turno, checked: boolean) => {
    setTurnoDisponibilidade({
      ...turnoDisponibilidade,
      [turno]: checked
    });
  };

  React.useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      if (precosPorDia[dateStr]) {
        const precoDia = precosPorDia[dateStr];
        
        setTurnoInputs({
          morning: precoDia.morning ? precoDia.morning.toString() : "",
          afternoon: precoDia.afternoon ? precoDia.afternoon.toString() : "",
          evening: precoDia.evening ? precoDia.evening.toString() : ""
        });
        
        if (precoDia.availability) {
          setTurnoDisponibilidade({
            morning: precoDia.availability.morning !== false,
            afternoon: precoDia.availability.afternoon !== false,
            evening: precoDia.availability.evening !== false
          });
        } else {
          setTurnoDisponibilidade({
            morning: true,
            afternoon: true,
            evening: true
          });
        }
      } else {
        setTurnoInputs({morning: "", afternoon: "", evening: ""});
        setTurnoDisponibilidade({morning: true, afternoon: true, evening: true});
      }
    }
  }, [selectedDate, precosPorDia]);

  const handleApplyDefaultPrices = () => {
    const valorUteis = parseFloat(valorDiasUteis);
    const valorFimDeSemana = parseFloat(valorFimSemana);
    
    if (isNaN(valorUteis) || isNaN(valorFimDeSemana)) {
      toast({ title: "Valores inválidos", description: "Verifique os valores informados", variant: "destructive" });
      return;
    }
    
    const novosPrecos = { ...precosPorDiaSemana };
    
    for (let i = 1; i <= 5; i++) {
      novosPrecos[i] = {
        morning: valorUteis,
        afternoon: valorUteis,
        evening: valorUteis
      };
    }
    
    novosPrecos[0] = { morning: valorFimDeSemana, afternoon: valorFimDeSemana, evening: valorFimDeSemana };
    novosPrecos[6] = { morning: valorFimDeSemana, afternoon: valorFimDeSemana, evening: valorFimDeSemana };
    
    setPrecosPorDiaSemana(novosPrecos);
    toast({ title: "Preços padrão definidos", description: "Os preços padrão foram atualizados" });
  };

  const getPricesFromCalendar = () => {
    return {
      defaultPricing: precosPorDiaSemana,
      specificDates: precosPorDia
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Atualizando cabine:", cabin.id);
      
      const pricing = getPricesFromCalendar();
      
      const cabinData = {
        name,
        description,
        equipment,
        pricing
      };
      
      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('cabins')
        .update(cabinData)
        .eq('id', cabin.id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar cabine:", error);
        toast({ title: "Erro ao atualizar cabine", description: error.message, variant: "destructive" });
        return;
      }
      
      console.log("Cabine atualizada com sucesso:", data);
      
      // Transformar para o formato da interface Cabin
      const cabineAtualizada: Cabin = {
        ...cabin,
        name: data.name,
        description: data.description || "",
        equipment: data.equipment || [],
        pricing: data.pricing as {
          defaultPricing: {
            [dayOfWeek: string]: {
              morning: number;
              afternoon: number;
              evening: number;
            };
          };
          specificDates: {
            [date: string]: {
              morning: number;
              afternoon: number;
              evening: number;
              availability?: {
                morning: boolean;
                afternoon: boolean;
                evening: boolean;
              };
            };
          };
        }
      };
      
      onCabinUpdated?.(cabineAtualizada);
      toast({ title: "Cabine atualizada com sucesso!" });
      onOpenChange(false);
      
    } catch (error: any) {
      console.error("Erro ao processar atualização de cabine:", error);
      toast({ 
        title: "Erro ao atualizar cabine", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Cabine</DialogTitle>
          <DialogDescription>
            Atualize os dados da cabine e seus preços por turno para diferentes dias da semana ou datas específicas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nome da Cabine</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da cabine"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da cabine"
                rows={3}
              />
            </div>
            <CabinEquipmentInput equipment={equipment} setEquipment={setEquipment} />
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Configuração de Preços</h3>
            <CabinPricingConfigurator
              precosPorDia={precosPorDia}
              setPrecosPorDia={setPrecosPorDia}
              precosPorDiaSemana={precosPorDiaSemana}
              setPrecosPorDiaSemana={setPrecosPorDiaSemana}
              valorDiasUteis={valorDiasUteis}
              setValorDiasUteis={setValorDiasUteis}
              valorFimSemana={valorFimSemana}
              setValorFimSemana={setValorFimSemana}
              turnoInputs={turnoInputs}
              setTurnoInputs={setTurnoInputs}
              turnoDisponibilidade={turnoDisponibilidade}
              setTurnoDisponibilidade={setTurnoDisponibilidade}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
