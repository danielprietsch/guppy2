
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
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Json } from "@/integrations/supabase/types";
import { Scissors } from "lucide-react";
import { debugLog, debugError } from "@/utils/debugLogger";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  cidade: z.string().min(2, "Cidade deve ser preenchida"),
  estado: z.string().min(2, "Estado deve ser preenchido"),
  cep: z.string().optional(),
  imageUrl: z.string().optional(),
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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
      imageUrl: "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      console.log("🔄 Starting location creation process");
      debugLog("OwnerAddLocationModal: Starting location creation");

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        console.error("❌ No authenticated user found");
        toast.error("Usuário não autenticado");
        debugError("OwnerAddLocationModal: No authenticated user found");
        return;
      }
      
      const userId = session.user.id;
      console.log("👤 Creating location for user:", userId);
      debugLog("OwnerAddLocationModal: Creating location for user", userId);
      
      const openingHours = { open: "08:00", close: "20:00" };
      
      // Usar a nova função create_location
      const { data, error } = await supabase
        .rpc('create_location', {
          p_owner_id: userId,
          p_name: values.nome,
          p_address: values.endereco,
          p_city: values.cidade,
          p_state: values.estado,
          p_zip_code: values.cep || "",
          p_opening_hours: openingHours as unknown as Json,
          p_image_url: previewImage || DEFAULT_IMAGE,
          p_description: ""
        });

      if (error) {
        console.error("❌ ERROR CREATING LOCATION:", error);
        debugError("OwnerAddLocationModal: Error creating location:", error);
        toast.error("Erro ao cadastrar local: " + error.message);
        return;
      }

      console.log("✅ Location created successfully, ID:", data);
      
      // Buscar o local recém-criado para obter todos os dados
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', data)
        .single();
        
      if (locationError) {
        console.error("❌ ERROR FETCHING CREATED LOCATION:", locationError);
        debugError("OwnerAddLocationModal: Error fetching created location:", locationError);
        toast.error("Local criado mas não foi possível carregar os detalhes");
        return;
      }

      const novoLocation: Location = {
        id: locationData.id,
        name: locationData.name,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        zipCode: locationData.zip_code,
        cabinsCount: locationData.cabins_count || 0,
        openingHours: (locationData.opening_hours as unknown as { open: string; close: string }) || { open: "09:00", close: "18:00" },
        amenities: locationData.amenities || [],
        imageUrl: locationData.image_url,
        description: locationData.description || "",
        active: locationData.active
      };

      debugLog("OwnerAddLocationModal: Location created successfully:", novoLocation.id);
      toast.success("Local cadastrado com sucesso!");
      
      if (onLocationCreated) {
        onLocationCreated(novoLocation);
      }
      
      onOpenChange(false);
      form.reset();
      setPreviewImage(null);
    } catch (error: any) {
      console.error("❌ CRITICAL ERROR CREATING LOCATION:", error);
      debugError("OwnerAddLocationModal: Error processing location creation:", error);
      toast.error("Erro ao cadastrar local: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="flex justify-center mb-4">
              <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden bg-muted">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scissors className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm">Clique para adicionar imagem</span>
                </div>
              </div>
            </div>

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
                <Button type="button" variant="outline" disabled={isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Cadastrando..." : "Cadastrar Local"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
