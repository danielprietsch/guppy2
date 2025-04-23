
import { Json } from "@/integrations/supabase/types";

export interface PrecoPorTurno {
  morning: number;
  afternoon: number;
  evening: number;
  availability?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

export interface PrecosPorDia {
  [date: string]: PrecoPorTurno;
}

export interface PrecosPorDiaSemana {
  0: PrecoPorTurno;
  1: PrecoPorTurno;
  2: PrecoPorTurno;
  3: PrecoPorTurno;
  4: PrecoPorTurno;
  5: PrecoPorTurno;
  6: PrecoPorTurno;
}

export type TurnoInputs = {
  morning: string;
  afternoon: string;
  evening: string;
};

export type TurnoDisponibilidade = {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
};

export const getPricesFromCalendar = (
  precosPorDiaSemana: PrecosPorDiaSemana,
  precosPorDia: PrecosPorDia
): { defaultPricing: PrecosPorDiaSemana; specificDates: PrecosPorDia } => ({
  defaultPricing: precosPorDiaSemana,
  specificDates: precosPorDia
});

export const getDefaultPricing = (): PrecosPorDiaSemana => ({
  0: { morning: 150, afternoon: 150, evening: 150 },
  1: { morning: 100, afternoon: 100, evening: 100 },
  2: { morning: 100, afternoon: 100, evening: 100 },
  3: { morning: 100, afternoon: 100, evening: 100 },
  4: { morning: 100, afternoon: 100, evening: 100 },
  5: { morning: 100, afternoon: 100, evening: 100 },
  6: { morning: 150, afternoon: 150, evening: 150 },
});

export const getInitialTurnoInputs = (): TurnoInputs => ({
  morning: "",
  afternoon: "",
  evening: ""
});

export const getInitialTurnoDisponibilidade = (): TurnoDisponibilidade => ({
  morning: true,
  afternoon: true,
  evening: true
});

