
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Cabin } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { CabinPricingConfigurator } from "./CabinPricingConfigurator";
import { CabinEquipmentInput } from "./CabinEquipmentInput";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Json } from "@/integrations/supabase/types";

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
  0: PrecoPorTurno;
  1: PrecoPorTurno;
  2: PrecoPorTurno;
  3: PrecoPorTurno;
  4: PrecoPorTurno;
  5: PrecoPorTurno;
  6: PrecoPorTurno;
}

interface AddCabinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  onCabinCreated?: (cabin: Cabin) => void;
}

export const AddCabinModal: React.FC<AddCabinModalProps> = ({
  open,
  onOpenChange,
  locationId,
  onCabinCreated
}) => {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [equipment, setEquipment] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [precosPorDia, setPrecosPorDia] = React.useState<PrecosPorDia>({});
  const [activeTab, setActiveTab] = React.useState<string>("individual");
  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState<PrecosPorDiaSemana>({
    0: { morning: 150, afternoon: 150, evening: 150 }, // Domingo
    1: { morning: 100, afternoon: 100, evening: 100 }, // Segunda
    2: { morning: 100, afternoon: 100, evening: 100 }, // Terça
    3: { morning: 100, afternoon: 100, evening: 100 }, // Quarta
    4: { morning: 100, afternoon: 100, evening: 100 }, // Quinta
    5: { morning: 100, afternoon: 100, evening: 100 }, // Sexta
    6: { morning: 150, afternoon: 150, evening: 150 }, // Sábado
  });
  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>("100");
  const [valorFimSemana, setValorFimSemana] = React.useState<string>("150");
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

  const getPricesFromCalendar = () => ({
    defaultPricing: {
      ...precosPorDiaSemana
    },
    specificDates: {
      ...precosPorDia
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Criando nova cabine para o local:", locationId);
      
      // Define os dados da cabine
      const availability = {
        morning: true,
        afternoon: true,
        evening: true
      };
      
      const pricing = getPricesFromCalendar();
      
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('cabins')
        .insert({
          location_id: locationId,
          name,
          description,
          equipment,
          image_url: "",
          availability, 
          pricing
        })
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao adicionar cabine:", error);
        toast({ title: "Erro ao adicionar cabine", description: error.message, variant: "destructive" });
        return;
      }
      
      console.log("Cabine adicionada com sucesso:", data);
      
      // Transformar para o formato da interface Cabin
      const novaCabine: Cabin = {
        id: data.id,
        locationId: data.location_id,
        name: data.name,
        description: data.description || "",
        equipment: data.equipment || [],
        imageUrl: data.image_url || "",
        availability: data.availability as { morning: boolean; afternoon: boolean; evening: boolean },
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
      
      onCabinCreated?.(novaCabine);
      toast({ title: "Cabine adicionada com sucesso!" });
      onOpenChange(false);

      // Limpar formulário
      setName("");
      setDescription("");
      setEquipment([]);
      setPrecosPorDia({});
      setSelectedDate(undefined);
      
    } catch (error: any) {
      console.error("Erro ao processar adição de cabine:", error);
      toast({ 
        title: "Erro ao adicionar cabine", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Cabine</DialogTitle>
          <DialogDescription>
            Cadastre uma nova cabine e defina seus preços por turno para diferentes dias da semana ou datas específicas.
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
                className="w-full"
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
                className="w-full"
              />
            </div>
            <CabinEquipmentInput equipment={equipment} setEquipment={setEquipment} />
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Configuração de Preços</h3>
            <div className="max-w-full overflow-x-auto pb-2">
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
          </div>
          <DialogFooter className="flex justify-end gap-2 flex-wrap sm:flex-nowrap">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adicionando..." : "Adicionar Cabine"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
