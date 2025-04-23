
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Cabin } from "@/lib/types";
import { useState } from "react";
import { CabinForm } from "./CabinForm";
import { getPricesFromCalendar, getDefaultPricing, TurnoInputs, TurnoDisponibilidade } from "./cabinUtils";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

interface EditCabinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cabin: Cabin;
  onCabinUpdated?: (cabin: Cabin) => void;
}

export const EditCabinModal: React.FC<EditCabinModalProps> = ({
  open,
  onOpenChange,
  cabin,
  onCabinUpdated
}) => {
  const [name, setName] = useState(cabin.name);
  const [description, setDescription] = useState(cabin.description);
  const [equipment, setEquipment] = useState<string[]>(cabin.equipment);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [precosPorDia, setPrecosPorDia] = React.useState(cabin.pricing?.specificDates || {});
  const [activeTab, setActiveTab] = React.useState<string>("padrao");
  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState(cabin.pricing?.defaultPricing || getDefaultPricing());

  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>("100");
  const [valorFimSemana, setValorFimSemana] = React.useState<string>("150");
  const [turnoInputs, setTurnoInputs] = React.useState<TurnoInputs>({
    morning: "",
    afternoon: "",
    evening: ""
  });
  const [turnoDisponibilidade, setTurnoDisponibilidade] = React.useState<TurnoDisponibilidade>({
    morning: true,
    afternoon: true,
    evening: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const pricing = getPricesFromCalendar(precosPorDiaSemana, precosPorDia);
      
      const cabinData = {
        name,
        description,
        equipment,
        pricing
      };
      
      const { data, error } = await supabase
        .from('cabins')
        .update(cabinData as { pricing: Json })
        .eq('id', cabin.id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar cabine:", error);
        toast({ title: "Erro ao atualizar cabine", description: error.message, variant: "destructive" });
        return;
      }
      
      const cabineAtualizada: Cabin = {
        ...cabin,
        name: data.name,
        description: data.description || "",
        equipment: data.equipment || [],
        pricing: {
          defaultPricing: ((data.pricing as unknown as { defaultPricing: any })?.defaultPricing) || {},
          specificDates: ((data.pricing as unknown as { specificDates: any })?.specificDates) || {}
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
