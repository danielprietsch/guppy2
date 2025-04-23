
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [precosPorDia, setPrecosPorDia] = React.useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [precoCabine, setPrecoCabine] = React.useState("");

  const handleAddPrice = () => {
    if (selectedDate && precoCabine) {
      setPrecosPorDia({
        ...precosPorDia,
        [format(selectedDate, "yyyy-MM-dd")]: parseFloat(precoCabine),
      });
      setPrecoCabine("");
      setSelectedDate(undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !endereco || !cidade || !estado || !cabinas) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    toast({ title: "Local cadastrado (exemplo)", description: "O local foi cadastrado apenas na interface." });
    onLocationCreated?.({
      nome, endereco, cidade, estado, cabinas: Number(cabinas), precosPorDia
    });
    onOpenChange(false);

    // Reset form
    setNome("");
    setEndereco("");
    setCidade("");
    setEstado("");
    setCabinas("");
    setPrecosPorDia({});
    setPrecoCabine("");
    setSelectedDate(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Local</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Nome do local" value={nome} onChange={e => setNome(e.target.value)} required />
          <Input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} required />
          <Input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
          <Input placeholder="Estado" value={estado} onChange={e => setEstado(e.target.value)} required />
          <Input placeholder="Quantidade de cabines" type="number" min={1} value={cabinas} onChange={e => setCabinas(e.target.value.replace(/\D/g, ""))} required />

          <div>
            <label className="font-semibold text-sm mb-1 block">Preços por cabine/dia</label>
            <div className="flex items-center gap-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={ptBR}
                className="w-auto rounded border"
              />
              <Input
                placeholder="Preço R$"
                className="w-32"
                value={precoCabine}
                type="number"
                min={1}
                step={0.01}
                onChange={e => setPrecoCabine(e.target.value.replace(/[^\d.]/g, ""))}
                disabled={!selectedDate}
              />
              <Button type="button" variant="outline" className="h-10" onClick={handleAddPrice} disabled={!selectedDate || !precoCabine}>
                Definir preço
              </Button>
            </div>
            <div className="mt-2 overflow-y-auto max-h-32 text-sm bg-muted rounded p-2">
              {Object.entries(precosPorDia).length === 0 ? (
                <span className="text-muted-foreground text-xs">Nenhum preço definido</span>
              ) : (
                Object.entries(precosPorDia).map(([date, price]) => (
                  <div key={date} className="flex justify-between">
                    <span>{format(new Date(date), "dd/MM/yyyy")}</span>
                    <span>R$ {price.toFixed(2)}</span>
                  </div>
                ))
              )}
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
