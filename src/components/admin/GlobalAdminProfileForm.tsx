import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { debugLog } from "@/utils/debugLogger";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  phoneNumber: z.string().optional(),
  avatarUrl: z.string().optional(),
});

interface GlobalAdminProfileFormProps {
  currentUser: User;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
}

export function GlobalAdminProfileForm({ currentUser, onSubmit }: GlobalAdminProfileFormProps) {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      avatarUrl: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      form.reset({
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || "",
        avatarUrl: currentUser.avatarUrl || "",
      });
    }
  }, [currentUser, form]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      debugLog("GlobalAdminProfileForm: Submitting form values:", values);
      await onSubmit(values);
    } catch (error) {
      debugLog("GlobalAdminProfileForm: Error in form submission:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
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
                <Input placeholder="seu@email.com" {...field} type="email" />
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
                <Input placeholder="(00) 00000-0000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da foto de perfil</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/sua-foto.jpg" {...field} />
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
          >
            Cancelar
          </Button>
          <Button type="submit">
            Salvar alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}
