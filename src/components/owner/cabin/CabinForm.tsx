
import * as React from "react";
import { CabinBasicInfo } from "./components/CabinBasicInfo";
import { CabinPricingConfigurator } from "../CabinPricingConfigurator";
import type { CabinFormComponentProps } from "./types/cabinFormTypes";

export const CabinForm: React.FC<CabinFormComponentProps> = ({
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
      <CabinBasicInfo
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        equipment={equipment}
        setEquipment={setEquipment}
      />
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
