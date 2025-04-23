
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Location } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationCreated?: (locationData: Location) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !endereco || !cidade || !estado) {
      toast({ title: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    // Criação "mock" de local, sem preços ou quantidade de cabines
    const novoLocation: Location = {
      id: Math.random().toString(36).slice(2),
      name: nome,
      address: endereco,
      city: cidade,
      state: estado,
      zipCode: "",
      cabinsCount: 0, // valor padrão zero, já que não será inserido agora
      openingHours: { open: "08:00", close: "20:00" },
      amenities: [],
      imageUrl: "",
      description: ""
    };

    toast({ title: "Local cadastrado!", description: "O local foi cadastrado com sucesso." });
    
    if (onLocationCreated) {
      onLocationCreated(novoLocation);
    }
    
    onOpenChange(false);

    // Reset form
    setNome("");
    setEndereco("");
    setCidade("");
    setEstado("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Local</DialogTitle>
          <DialogDescription>
            Informe os dados básicos do local. O cadastro de valores por turno/dia e de cabines será feito depois.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Nome do local" value={nome} onChange={e => setNome(e.target.value)} required />
          <Input placeholder="Endereço" value={endereco} onChange={e => setEndereco(e.target.value)} required />
          <div className="flex gap-2">
            <Input placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
            <Input placeholder="Estado" value={estado} onChange={e => setEstado(e.target.value)} required />
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
