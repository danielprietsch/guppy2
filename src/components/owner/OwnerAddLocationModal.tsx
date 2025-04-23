
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Location } from "@/lib/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  cidade: z.string().min(2, "Cidade deve ser preenchida"),
  estado: z.string().min(2, "Estado deve ser preenchido"),
  cep: z.string().optional(),
});

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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Criação do novo local
    const novoLocation: Location = {
      id: Math.random().toString(36).slice(2),
      name: values.nome,
      address: values.endereco,
      city: values.cidade,
      state: values.estado,
      zipCode: values.cep || "",
      cabinsCount: 0,
      openingHours: { open: "08:00", close: "20:00" },
      amenities: [],
      imageUrl: "",
      description: ""
    };

    toast.success("Local cadastrado com sucesso!");
    
    if (onLocationCreated) {
      onLocationCreated(novoLocation);
    }
    
    onOpenChange(false);
    form.reset();
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do local</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="CEP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 mt-2 flex-row justify-end">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Cadastrar Local</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
