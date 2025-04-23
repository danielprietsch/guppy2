
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Cabin } from "@/lib/types";
import { useState } from "react";
import { CabinCreateForm } from "./cabin/CabinCreateForm";
import { useCabinCreation } from "./cabin/hooks/useCabinCreation";
import { getDefaultPricing, getInitialTurnoInputs, getInitialTurnoDisponibilidade } from "./cabin/cabinUtils";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [precosPorDia, setPrecosPorDia] = React.useState({});
  const [activeTab, setActiveTab] = React.useState<string>("individual");
  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState(getDefaultPricing());
  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>("100");
  const [valorFimSemana, setValorFimSemana] = React.useState<string>("150");
  const [turnoInputs, setTurnoInputs] = React.useState(getInitialTurnoInputs());
  const [turnoDisponibilidade, setTurnoDisponibilidade] = React.useState(getInitialTurnoDisponibilidade());

  const { createCabin, isSubmitting } = useCabinCreation(locationId, onCabinCreated, () => {
    onOpenChange(false);
    resetForm();
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setEquipment([]);
    setPrecosPorDia({});
    setSelectedDate(undefined);
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
        <CabinCreateForm
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
          onSubmit={createCabin}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
