
import * as React from "react";
import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CabinForm } from "./CabinForm";
import { CabinFormProps } from "./types/cabinTypes";

export const CabinCreateForm: React.FC<CabinFormProps> = ({
  name,
  description,
  equipment,
  precosPorDia,
  precosPorDiaSemana,
  valorDiasUteis,
  setValorDiasUteis,
  valorFimSemana,
  setValorFimSemana,
  selectedDate,
  setSelectedDate,
  activeTab,
  setActiveTab,
  onSubmit,
  isSubmitting,
  onCancel,
  ...props
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      description,
      equipment,
      precosPorDia,
      precosPorDiaSemana,
      turnoDisponibilidade: props.turnoDisponibilidade,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CabinForm
        name={name}
        setName={(name) => props.setName?.(name)}
        description={description}
        setDescription={(desc) => props.setDescription?.(desc)}
        equipment={equipment}
        setEquipment={props.setEquipment}
        precosPorDia={precosPorDia}
        setPrecosPorDia={props.setPrecosPorDia}
        precosPorDiaSemana={precosPorDiaSemana}
        setPrecosPorDiaSemana={props.setPrecosPorDiaSemana}
        valorDiasUteis={valorDiasUteis}
        setValorDiasUteis={setValorDiasUteis}
        valorFimSemana={valorFimSemana}
        setValorFimSemana={setValorFimSemana}
        turnoInputs={props.turnoInputs}
        setTurnoInputs={props.setTurnoInputs}
        turnoDisponibilidade={props.turnoDisponibilidade}
        setTurnoDisponibilidade={props.setTurnoDisponibilidade}
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
