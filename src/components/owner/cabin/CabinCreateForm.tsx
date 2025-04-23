
import * as React from "react";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CabinForm } from "./CabinForm";
import { CabinFormState } from "./types/cabinTypes";

interface CabinCreateFormProps extends CabinFormState {
  onSubmit: (formState: CabinFormState) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  setEquipment: React.Dispatch<React.SetStateAction<string[]>>;
  setPrecosPorDia: React.Dispatch<React.SetStateAction<any>>;
  setPrecosPorDiaSemana: React.Dispatch<React.SetStateAction<any>>;
  valorDiasUteis: string;
  setValorDiasUteis: (value: string) => void;
  valorFimSemana: string;
  setValorFimSemana: (value: string) => void;
  turnoInputs: any;
  setTurnoInputs: React.Dispatch<React.SetStateAction<any>>;
  setTurnoDisponibilidade: React.Dispatch<React.SetStateAction<any>>;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CabinCreateForm: React.FC<CabinCreateFormProps> = ({
  name,
  setName,
  description,
  setDescription,
  equipment,
  setEquipment,
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
  setActiveTab,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description,
      equipment,
      precosPorDia,
      precosPorDiaSemana,
      turnoDisponibilidade,
    });
  };

  return (
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
          <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={isSubmitting} onClick={onCancel}>
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
  );
};
