
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefaultPricingSection } from "./cabin/pricing/DefaultPricingSection";
import { SpecificDatesPricingSection } from "./cabin/pricing/SpecificDatesPricingSection";
import type { PrecosPorDia, PrecosPorDiaSemana, TurnoInputs, TurnoDisponibilidade } from "./cabin/cabinUtils";

interface CabinPricingConfiguratorProps {
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
  setActiveTab,
}) => {
  return (
    <div>
      <Tabs defaultValue="padrao" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="padrao">Preços Padrão</TabsTrigger>
          <TabsTrigger value="individual">Datas Específicas</TabsTrigger>
        </TabsList>

        <TabsContent value="padrao" className="mt-4">
          <DefaultPricingSection
            valorDiasUteis={valorDiasUteis}
            setValorDiasUteis={setValorDiasUteis}
            valorFimSemana={valorFimSemana}
            setValorFimSemana={setValorFimSemana}
            precosPorDiaSemana={precosPorDiaSemana}
            setPrecosPorDiaSemana={setPrecosPorDiaSemana}
          />
        </TabsContent>

        <TabsContent value="individual" className="mt-4">
          <SpecificDatesPricingSection
            precosPorDia={precosPorDia}
            setPrecosPorDia={setPrecosPorDia}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            turnoInputs={turnoInputs}
            setTurnoInputs={setTurnoInputs}
            turnoDisponibilidade={turnoDisponibilidade}
            setTurnoDisponibilidade={setTurnoDisponibilidade}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
