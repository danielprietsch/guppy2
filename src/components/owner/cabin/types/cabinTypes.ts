
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
  valorDiasUteis: string;
  setValorDiasUteis: (value: string) => void;
  valorFimSemana: string;
  setValorFimSemana: (value: string) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
