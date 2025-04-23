
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CabinEquipmentInput } from "./equipment/CabinEquipmentInput";
import { CabinPricingConfigurator } from "./CabinPricingConfigurator";
import { PrecosPorDia, PrecosPorDiaSemana, TurnoInputs, TurnoDisponibilidade } from "./cabin/cabinUtils";

interface CabinFormProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  equipment: string[];
  setEquipment: React.Dispatch<React.SetStateAction<string[]>>;
  precosPorDia: PrecosPorDia;
  setPrecosPorDia: React.Dispatch<React.SetStateAction<PrecosPorDia>>;
  precosPorDiaSemana: PrecosPorDiaSemana;
  setPrecosPorDiaSemana: React.Dispatch<React.SetStateAction<PrecosPorDiaSemana>>;
  valorDiasUteis: string;
  setValorDiasUteis: React.Dispatch<React.SetStateAction<string>>;
  valorFimSemana: string;
  setValorFimSemana: React.Dispatch<React.SetStateAction<string>>;
  turnoInputs: TurnoInputs;
  setTurnoInputs: React.Dispatch<React.SetStateAction<TurnoInputs>>;
  turnoDisponibilidade: TurnoDisponibilidade;
  setTurnoDisponibilidade: React.Dispatch<React.SetStateAction<TurnoDisponibilidade>>;
  selectedDate: Date | undefined;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
}

export const CabinForm: React.FC<CabinFormProps> = ({
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
}) => {
  return (
    <div className="space-y-4">
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
    </div>
  );
};
