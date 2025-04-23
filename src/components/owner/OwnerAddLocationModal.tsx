
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

type Turno = "morning" | "afternoon" | "evening";

const TURNOS: { key: Turno, label: string }[] = [
  { key: "morning", label: "Manhã" },
  { key: "afternoon", label: "Tarde" },
  { key: "evening", label: "Noite" }
];

interface PrecoPorTurno {
  morning?: number;
  afternoon?: number;
  evening?: number;
}
interface PrecosPorDia {
  [date: string]: PrecoPorTurno;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationCreated?: (locationData: any) => void;
}

export const OwnerAddLocationModal: React.FC<Props> = ({
  open,
  onOpenChange,
  onLocationCreated
}) => {
  const [nome, setNome] = React.useState("");
  const [endereco, setEndereco] = React.useState("");
  const [cidade, setCidade] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [cabinas, setCabinas] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<Date>();
  const [precosPorDia, setPrecosPorDia] = React.useState<PrecosPorDia>({});
  const [turnoInputs, setTurnoInputs] = React.useState<{ [key in Turno]: string }>({morning: "", afternoon: "", evening: ""});

  // Adiciona preços para o dia e turnos selecionados
  const handleAddPriceByDay = () => {
    if (!selectedDate) {
      toast({ title: "Selecione uma data!", variant: "destructive" });
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const novosPrecos = {...precosPorDia};
    if (!novosPrecos[dateStr]) novosPrecos[dateStr] = {};
    TURNOS.forEach(turno => {
      const valor = parseFloat(turnoInputs[turno.key]);
      if (valor && valor > 0) novosPrecos[dateStr][turno.key] = valor;
    });
    setPrecosPorDia(novosPrecos);
    setSelectedDate(undefined);
    setTurnoInputs({morning: "", afternoon: "", evening: ""});
  };

  const handleTurnoInputChange = (turno: Turno, value: string) => {
    setTurnoInputs({
      ...turnoInputs,
      [turno]: value.replace(/[^\d.]/g, "")
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !endereco || !cidade || !estado || !cabinas) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    if (Object.keys(precosPorDia).length === 0) {
      toast({ title: "Defina ao menos um preço no calendário!", variant: "destructive" });
      return;
    }

    // Criação "mock" de local
    const novoLocation = {
      id: Math.random().toString(36).slice(2),
      name: nome,
      address: endereco,
      city: cidade,
      state: estado,
      zipCode: "",
      cabinsCount: Number(cabinas),
      openingHours: { open: "08:00", close: "20:00" },
      amenities: [],
      imageUrl: "",
      description: "",
      pricing: {...precosPorDia}
    };

    toast({ title: "Local cadastrado!", description: "O local foi cadastrado apenas na interface." });
    onLocationCreated?.(novoLocation);
    onOpenChange(false);

    // Reset form
    setNome("");
    setEndereco("");
    setCidade("");
    setEstado("");
    setCabinas("");
    setPrecosPorDia({});
    setSelectedDate(undefined);
    setTurnoInputs({morning: "", afternoon: "", evening: ""});
  };

  // Exibir preços adicionados
  const renderPrecos = () => {
    if (Object.keys(precosPorDia).length === 0) {
      return <span className="text-muted-foreground text-xs">Nenhum preço definido</span>
    }
    return Object.entries(precosPorDia).map(([date, turnos]) => (
      <div key={date} className="mb-1">
        <span className="font-semibold">{format(new Date(date), "dd/MM/yyyy")}</span>
        <div className="flex flex-wrap gap-2 ml-2 mt-1 mb-1">
          {TURNOS.map(turno => {
            if (turnos[turno.key] !== undefined)
              return (
                <span key={turno.key} className="px-2 py-0.5 rounded bg-primary text-xs text-primary-foreground">
                  {turno.label}: R$ {Number(turnos[turno.key]).toFixed(2)}
                </span>
              );
            return null;
          })}
        </div>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Local</DialogTitle>
          <DialogDescription>
            Informe os dados básicos do local, quantidade de cabines e defina no calendário os preços por turno dos dias de funcionamento.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Nome do local" value={nome} onChange={e => setNome(e.target.value)} required />
          <Input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} required />
          <div className="flex gap-2">
            <Input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
            <Input placeholder="Estado" value={estado} onChange={e => setEstado(e.target.value)} required />
          </div>
          <Input placeholder="Quantidade de cabines" type="number" min={1} value={cabinas} onChange={e => setCabinas(e.target.value.replace(/\D/g, ""))} required />

          <div>
            <label className="font-semibold text-sm mb-1 block">Preços por turno / dia</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-1/2 flex flex-col">
                <span className="text-xs mb-1">Selecione o dia:</span>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="w-auto rounded border pointer-events-auto"
                />
              </div>
              <div className="flex-1 flex flex-col gap-2 justify-start">
                <span className="text-xs mb-1">Preços para o(s) turnos:</span>
                {TURNOS.map(turno => (
                  <div key={turno.key} className="flex items-center gap-2">
                    <span className="w-[60px] text-right text-xs">{turno.label}:</span>
                    <Input
                      type="number"
                      placeholder="R$"
                      min={1}
                      value={turnoInputs[turno.key]}
                      onChange={e => handleTurnoInputChange(turno.key, e.target.value)}
                      className="w-28"
                      disabled={!selectedDate}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  className="mt-2"
                  variant="outline"
                  onClick={handleAddPriceByDay}
                  disabled={!selectedDate || (TURNOS.every(t => !turnoInputs[t.key]))}
                >
                  Definir preço para o dia/turnos
                </Button>
              </div>
            </div>
            <div className="mt-2 overflow-y-auto max-h-36 text-sm bg-muted rounded p-2 border">
              {renderPrecos()}
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2 flex-row justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Cadastrar Local</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
