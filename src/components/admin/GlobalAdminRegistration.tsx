
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
import { debugLog, debugError } from "@/utils/debugLogger";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export const GlobalAdminRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create the global admin user account
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            userType: "global_admin",
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
          }
        }
      });
      
      if (userError || !userData.user) {
        debugError("GlobalAdminRegistration: Error creating user:", userError);
        toast({
          title: "Erro",
          description: "Não foi possível criar o usuário administrador global.",
          variant: "destructive",
        });
        return;
      }
      
      debugLog("GlobalAdminRegistration: User created successfully:", userData.user.id);
      
      // Add global admin role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: "global_admin"
        });
        
      if (roleError) {
        debugError("GlobalAdminRegistration: Error adding global admin role:", roleError);
        toast({
          title: "Aviso",
          description: "Usuário criado, mas houve um erro ao atribuir a função de administrador global.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Sucesso",
        description: "Administrador global criado com sucesso.",
      });
      
      // Reset the form
      form.reset();
      
    } catch (error) {
      debugError("GlobalAdminRegistration: Error in onSubmit:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o administrador global.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Administrador Global</CardTitle>
        <CardDescription>
          Crie um novo administrador global do sistema
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
                  <FormLabel>Nome do Administrador</FormLabel>
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
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Cadastrar Administrador Global"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
