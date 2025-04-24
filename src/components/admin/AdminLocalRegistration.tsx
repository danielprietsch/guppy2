
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { debugLog, debugError } from "@/utils/debugLogger";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  locationName: z.string().min(1, "Nome do local é obrigatório"),
});

type FormValues = z.infer<typeof formSchema>;

export const AdminLocalRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      locationName: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Step 1: Create the admin user account
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            userType: "owner", // Admin local is an owner with special permissions
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
          }
        }
      });
      
      if (userError || !userData.user) {
        debugError("AdminLocalRegistration: Error creating user:", userError);
        toast({
          title: "Erro",
          description: "Não foi possível criar o usuário administrador local.",
          variant: "destructive",
        });
        return;
      }
      
      debugLog("AdminLocalRegistration: User created successfully:", userData.user.id);
      
      // Step 2: Add admin role to user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: "admin" // This will signify they are a local admin
        });
        
      if (roleError) {
        debugError("AdminLocalRegistration: Error adding admin role:", roleError);
        // Continue anyway, the user was created
      }
      
      // Step 3: Create a default location for the admin
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          name: data.locationName,
          owner_id: userData.user.id,
          address: "A definir",
          city: "A definir",
          state: "A definir",
          zip_code: "00000-000",
          active: true // Automatically approved since created by global admin
        })
        .select('id')
        .single();
      
      if (locationError) {
        debugError("AdminLocalRegistration: Error creating location:", locationError);
        toast({
          title: "Aviso",
          description: "Usuário criado, mas não foi possível criar o local automaticamente.",
          variant: "destructive",
        });
      } else {
        debugLog("AdminLocalRegistration: Location created successfully:", locationData.id);
      }
      
      toast({
        title: "Sucesso",
        description: "Administrador local criado com sucesso.",
      });
      
      // Reset the form
      form.reset();
      
    } catch (error) {
      debugError("AdminLocalRegistration: Error in onSubmit:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar o administrador local.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cadastro de Administrador Local</CardTitle>
        <CardDescription>
          Crie um novo administrador local com seu respectivo local
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
            
            <FormField
              control={form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Local</FormLabel>
                  <FormControl>
                    <Input placeholder="Studio Beauty" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Cadastrar Administrador Local"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
