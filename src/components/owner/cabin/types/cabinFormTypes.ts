
import { PrecosPorDia, PrecosPorDiaSemana, TurnoInputs, TurnoDisponibilidade } from "../cabinUtils";

export interface CabinBasicInfoProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  equipment: string[];
  setEquipment: React.Dispatch<React.SetStateAction<string[]>>;
}

export interface CabinPricingProps {
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

export interface CabinFormComponentProps extends CabinBasicInfoProps, CabinPricingProps {}
