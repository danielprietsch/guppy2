
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { debugAreaLog, debugAreaCritical } from "@/utils/debugLogger";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  phoneNumber: z.string().optional(),
});

interface ClientProfileFormProps {
  currentUser: User;
  onSave: (data: z.infer<typeof formSchema>) => Promise<void>;
  isLoading?: boolean;
}

export function ClientProfileForm({ currentUser, onSave, isLoading = false }: ClientProfileFormProps) {
  const navigate = useNavigate();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      debugAreaLog("CLIENT_PROFILE", "Setting form values from currentUser in ClientProfileForm", {
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || ""
      });
      
      form.reset({
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || "",
      });
    } else {
      debugAreaCritical("CLIENT_PROFILE", "currentUser is null in ClientProfileForm");
    }
  }, [currentUser, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    debugAreaLog("CLIENT_PROFILE", "Submitting form with values:", values);
    
    try {
      await onSave(values);
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
    } catch (error: any) {
      debugAreaCritical("CLIENT_PROFILE", "Error in onSubmit:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar seus dados.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Seu nome completo" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="seu@email.com" 
                  {...field} 
                  type="email" 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input 
                  placeholder="(00) 00000-0000" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            type="button"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
