import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Cabin } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { CabinForm } from "./cabin/CabinForm";
import { 
  getPricesFromCalendar, 
  getDefaultPricing, 
  getInitialTurnoInputs,
  getInitialTurnoDisponibilidade,
  type TurnoInputs,
  type TurnoDisponibilidade
} from "./cabin/cabinUtils";
import { Json } from "@/integrations/supabase/types";

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
  const [precosPorDia, setPrecosPorDia] = React.useState({});
  const [activeTab, setActiveTab] = React.useState<string>("individual");
  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState(getDefaultPricing());
  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>("100");
  const [valorFimSemana, setValorFimSemana] = React.useState<string>("150");
  const [turnoInputs, setTurnoInputs] = React.useState<TurnoInputs>(getInitialTurnoInputs());
  const [turnoDisponibilidade, setTurnoDisponibilidade] = React.useState<TurnoDisponibilidade>(getInitialTurnoDisponibilidade());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Criando nova cabine para o local:", locationId);
      
      const pricing = getPricesFromCalendar(precosPorDiaSemana, precosPorDia);
      
      const { data, error } = await supabase
        .from('cabins')
        .insert({
          location_id: locationId,
          name,
          description,
          equipment,
          image_url: "",
          availability: turnoDisponibilidade as unknown as Json,
          pricing: pricing as unknown as Json
        })
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao adicionar cabine:", error);
        toast({ title: "Erro ao adicionar cabine", description: error.message, variant: "destructive" });
        return;
      }
      
      console.log("Cabine adicionada com sucesso:", data);
      
      const novaCabine: Cabin = {
        id: data.id,
        locationId: data.location_id,
        name: data.name,
        description: data.description || "",
        equipment: data.equipment || [],
        imageUrl: data.image_url || "",
        availability: (data.availability as unknown as { morning: boolean; afternoon: boolean; evening: boolean }) || {
          morning: true,
          afternoon: true,
          evening: true
        },
        pricing: {
          defaultPricing: ((data.pricing as unknown as { defaultPricing: any })?.defaultPricing) || {},
          specificDates: ((data.pricing as unknown as { specificDates: any })?.specificDates) || {}
        }
      };
      
      onCabinCreated?.(novaCabine);
      toast({ title: "Cabine adicionada com sucesso!" });
      onOpenChange(false);

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
          <CabinForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            equipment={equipment}
            setEquipment={setEquipment}
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
