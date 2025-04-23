import { PrecosPorDia, PrecosPorDiaSemana, TurnoDisponibilidade } from "../cabinUtils";

export interface CabinFormState {
  name: string;
  description: string;
  equipment: string[];
  precosPorDia: PrecosPorDia;
  precosPorDiaSemana: PrecosPorDiaSemana;
  turnoDisponibilidade: TurnoDisponibilidade;
}

export interface CabinFormProps extends CabinFormState {
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
