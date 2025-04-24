
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { useClientProfile } from "@/hooks/useClientProfile";
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

const ClientProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, error, updateProfile } = useClientProfile();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (currentUser) {
      debugAreaLog("USER_ACTIONS", "Setting form values from currentUser:", currentUser);
      form.reset({
        name: currentUser.name,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || "",
      });
    }
  }, [currentUser, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    debugAreaLog("USER_ACTIONS", "Submitting form with values:", values);
    
    try {
      const result = await updateProfile({
        name: values.name,
        email: values.email,
        phoneNumber: values.phoneNumber,
      });
      
      if (!result.success) {
        throw result.error;
      }
      
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso.",
      });
    } catch (error) {
      debugAreaCritical("USER_ACTIONS", "Error updating profile:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Ocorreu um erro ao atualizar seus dados.",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
            <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Erro</h1>
            <p className="text-red-500 mb-4">{error || "Não foi possível carregar seu perfil."}</p>
            <Button onClick={() => navigate("/")}>Voltar para a página inicial</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Atualize suas informações pessoais
      </p>

      <div className="max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <input
                      className="w-full p-2 border rounded-md"
                      placeholder="Seu nome completo"
                      {...field}
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
                    <input
                      className="w-full p-2 border rounded-md"
                      placeholder="seu@email.com"
                      type="email"
                      {...field}
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
                    <input
                      className="w-full p-2 border rounded-md"
                      placeholder="(00) 00000-0000"
                      {...field}
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
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
              >
                Salvar alterações
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ClientProfilePage;
