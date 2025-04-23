import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Cabin } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { CabinPricingConfigurator } from "./CabinPricingConfigurator";
import { CabinEquipmentInput } from "./CabinEquipmentInput";

type Turno = "morning" | "afternoon" | "evening";

interface PrecoPorTurno {
  morning: number;
  afternoon: number;
  evening: number;
  availability?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

interface PrecosPorDia {
  [date: string]: PrecoPorTurno;
}

interface PrecosPorDiaSemana {
  0: PrecoPorTurno;
  1: PrecoPorTurno;
  2: PrecoPorTurno;
  3: PrecoPorTurno;
  4: PrecoPorTurno;
  5: PrecoPorTurno;
  6: PrecoPorTurno;
}

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
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [equipment, setEquipment] = React.useState<string[]>([]);

  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [precosPorDia, setPrecosPorDia] = React.useState<PrecosPorDia>({});
  const [activeTab, setActiveTab] = React.useState<string>("individual");
  const [precosPorDiaSemana, setPrecosPorDiaSemana] = React.useState<PrecosPorDiaSemana>({
    0: { morning: 150, afternoon: 150, evening: 150 }, // Domingo
    1: { morning: 100, afternoon: 100, evening: 100 }, // Segunda
    2: { morning: 100, afternoon: 100, evening: 100 }, // Terça
    3: { morning: 100, afternoon: 100, evening: 100 }, // Quarta
    4: { morning: 100, afternoon: 100, evening: 100 }, // Quinta
    5: { morning: 100, afternoon: 100, evening: 100 }, // Sexta
    6: { morning: 150, afternoon: 150, evening: 150 }, // Sábado
  });
  const [valorDiasUteis, setValorDiasUteis] = React.useState<string>("100");
  const [valorFimSemana, setValorFimSemana] = React.useState<string>("150");
  const [turnoInputs, setTurnoInputs] = React.useState<{ [key in Turno]: string }>({
    morning: "",
    afternoon: "",
    evening: ""
  });
  const [turnoDisponibilidade, setTurnoDisponibilidade] = React.useState<{ [key in Turno]: boolean }>({
    morning: true,
    afternoon: true,
    evening: true
  });

  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return;
    setEquipment([...equipment, equipmentInput.trim()]);
    setEquipmentInput("");
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const getPricesFromCalendar = () => ({
    defaultPricing: {
      ...precosPorDiaSemana
    },
    specificDates: {
      ...precosPorDia
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    const novaCabine: Cabin = {
      id: Math.random().toString(36).slice(2),
      locationId,
      name,
      description,
      equipment,
      imageUrl: "",
      availability: {
        morning: true,
        afternoon: true,
        evening: true
      },
      price: 100, // Preço base
      pricing: getPricesFromCalendar()
    };
    onCabinCreated?.(novaCabine);
    toast({ title: "Cabine adicionada com sucesso!" });
    onOpenChange(false);

    setName("");
    setDescription("");
    setEquipment([]);
    setPrecosPorDia({});
    setSelectedDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Cabine</DialogTitle>
          <DialogDescription>
            Cadastre uma nova cabine e defina seus preços por turno para diferentes dias da semana ou datas específicas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Nome da Cabine</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome da cabine"
                required
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
              />
            </div>
            <CabinEquipmentInput equipment={equipment} setEquipment={setEquipment} />
          </div>
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Configuração de Preços</h3>
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
          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary">
              Adicionar Cabine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
