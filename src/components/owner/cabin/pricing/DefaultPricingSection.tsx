
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { PrecosPorDiaSemana } from "../cabinUtils";

interface DefaultPricingSectionProps {
  valorDiasUteis: string;
  setValorDiasUteis: React.Dispatch<React.SetStateAction<string>>;
  valorFimSemana: string;
  setValorFimSemana: React.Dispatch<React.SetStateAction<string>>;
  precosPorDiaSemana: PrecosPorDiaSemana;
  setPrecosPorDiaSemana: React.Dispatch<React.SetStateAction<PrecosPorDiaSemana>>;
}

const DIAS_SEMANA = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"
];

const TURNOS = [
  { key: "morning" as const, label: "Manhã" },
  { key: "afternoon" as const, label: "Tarde" },
  { key: "evening" as const, label: "Noite" }
];

export const DefaultPricingSection: React.FC<DefaultPricingSectionProps> = ({
  valorDiasUteis,
  setValorDiasUteis,
  valorFimSemana,
  setValorFimSemana,
  precosPorDiaSemana,
  setPrecosPorDiaSemana,
}) => {
  const handleApplyDefaultPrices = () => {
    const valorUteis = parseFloat(valorDiasUteis);
    const valorFim = parseFloat(valorFimSemana);

    if (isNaN(valorUteis) || isNaN(valorFim)) {
      toast({ title: "Valores inválidos", description: "Verifique os valores informados", variant: "destructive" });
      return;
    }

    const novosPrecos: PrecosPorDiaSemana = { ...precosPorDiaSemana };
    for (let i = 1; i <= 5; i++) {
      novosPrecos[i as keyof PrecosPorDiaSemana] = {
        morning: valorUteis,
        afternoon: valorUteis,
        evening: valorUteis
      };
    }
    novosPrecos[0] = { morning: valorFim, afternoon: valorFim, evening: valorFim };
    novosPrecos[6] = { morning: valorFim, afternoon: valorFim, evening: valorFim };
    
    setPrecosPorDiaSemana(novosPrecos);
    toast({ title: "Preços padrão definidos", description: "Os preços padrão foram atualizados" });
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Dias úteis (Segunda a Sexta)</Label>
              <div className="flex items-center mt-1">
                <span className="mr-2">R$</span>
                <Input
                  value={valorDiasUteis}
                  onChange={(e) => setValorDiasUteis(e.target.value.replace(/[^\d.]/g, ""))}
                  className="w-24"
                />
              </div>
            </div>
            <div>
              <Label>Finais de semana (Sábado e Domingo)</Label>
              <div className="flex items-center mt-1">
                <span className="mr-2">R$</span>
                <Input
                  value={valorFimSemana}
                  onChange={(e) => setValorFimSemana(e.target.value.replace(/[^\d.]/g, ""))}
                  className="w-24"
                />
              </div>
            </div>
          </div>
          <Button type="button" onClick={handleApplyDefaultPrices} className="w-full">
            Aplicar Preços Padrão
          </Button>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Preços por dia da semana:</h4>
            <div className="space-y-2">
              {DIAS_SEMANA.map((dia, index) => (
                <div key={index} className="flex justify-between items-center py-1 border-b">
                  <span className="font-medium">{dia}</span>
                  <div className="flex gap-2">
                    {TURNOS.map(turno => (
                      <div key={turno.key} className="text-xs flex items-center">
                        <span className="mr-1">{turno.label}:</span>
                        <span className="font-medium">
                          R$ {precosPorDiaSemana[index as keyof PrecosPorDiaSemana][turno.key].toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
