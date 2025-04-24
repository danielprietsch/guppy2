
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { debugLog, debugError } from "@/utils/debugLogger";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  userType: z.enum(["owner", "global_admin"], {
    required_error: "Tipo de usuário é obrigatório",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export const UserRegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      userType: "owner",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create user account
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            userType: data.userType,
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
          }
        }
      });
      
      if (userError || !userData.user) {
        debugError("UserRegistrationForm: Error creating user:", userError);
        toast({
          title: "Erro",
          description: "Não foi possível criar o usuário.",
          variant: "destructive",
        });
        return;
      }
      
      debugLog("UserRegistrationForm: User created successfully:", userData.user.id);
      
      // Add role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: data.userType
        });
        
      if (roleError) {
        debugError("UserRegistrationForm: Error adding role:", roleError);
        toast({
          title: "Aviso",
          description: "Usuário criado, mas houve um erro ao atribuir a função.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Sucesso",
        description: `${data.userType === "owner" ? "Dono de local" : "Administrador global"} criado com sucesso.`,
      });
      
      form.reset();
      
    } catch (error) {
      debugError("UserRegistrationForm: Error in onSubmit:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o usuário.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Usuários</CardTitle>
        <CardDescription>
          Crie novos donos de locais ou administradores globais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
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
                    <Input type="email" placeholder="joao@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Usuário</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="owner" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Dono de Local
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="global_admin" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Administrador Global
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Cadastrar Usuário"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
