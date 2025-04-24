import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

const validateCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let checkDigit1 = remainder === 10 || remainder === 11 ? 0 : remainder;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let checkDigit2 = remainder === 10 || remainder === 11 ? 0 : remainder;

  return cpf.charAt(9) === checkDigit1.toString() && cpf.charAt(10) === checkDigit2.toString();
};

const validateCNPJ = (cnpj: string): boolean => {
  cnpj = cnpj.replace(/[^\d]/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let sum = 0;
  let weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight[i];
  }
  let remainder = sum % 11;
  let checkDigit1 = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * weight[i];
  }
  remainder = sum % 11;
  let checkDigit2 = remainder < 2 ? 0 : 11 - remainder;

  return cnpj.charAt(12) === checkDigit1.toString() && cnpj.charAt(13) === checkDigit2.toString();
};

const ownerFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  companyName: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
  taxId: z.string().refine((value) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue.length === 11 ? validateCPF(cleanValue) : validateCNPJ(cleanValue);
  }, { message: "CPF ou CNPJ inválido" })
});

type OwnerFormValues = z.infer<typeof ownerFormSchema>;

export const OwnerRegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxIdType, setTaxIdType] = useState<'cpf' | 'cnpj'>('cpf');

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyName: "",
      phone: "",
      taxId: ""
    },
  });

  const onSubmit = async (data: OwnerFormValues) => {
    try {
      setIsSubmitting(true);
      debugLog("OwnerRegistrationForm: Registering new owner user", {
        name: data.name,
        email: data.email,
        companyName: data.companyName
      });

      // 1. Create user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            userType: "owner",
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Falha ao criar usuário");
      }

      debugLog("OwnerRegistrationForm: User created successfully", authData.user.id);

      // 2. Update profile with additional owner details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: data.companyName,
          phone_number: data.phone || null,
          [taxIdType === 'cpf' ? 'cpf' : 'cnpj']: data.taxId.replace(/[^\d]/g, '')
        })
        .eq('id', authData.user.id);

      if (profileError) {
        debugError("OwnerRegistrationForm: Error updating profile", profileError);
        toast({
          title: "Alerta",
          description: "Usuário criado, mas houve um erro ao salvar detalhes adicionais do perfil.",
          variant: "destructive"
        });
      } else {
        debugLog("OwnerRegistrationForm: Profile updated successfully");
      }

      toast({
        title: "Cadastro realizado com sucesso",
        description: "Sua conta de franqueado foi criada.",
      });

      // Redirect to owner dashboard or login
      navigate("/login");
    } catch (error: any) {
      debugError("OwnerRegistrationForm: Error during registration", error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro durante o cadastro.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Cadastro de Franqueado</h2>
        <p className="text-gray-600 mt-2">Complete o formulário abaixo para criar sua conta de franqueado</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
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
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Empresa Ltda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {taxIdType === 'cpf' ? 'CPF' : 'CNPJ'}
                    <span 
                      className="text-blue-500 text-sm ml-2 cursor-pointer"
                      onClick={() => setTaxIdType(taxIdType === 'cpf' ? 'cnpj' : 'cpf')}
                    >
                      (Mudar para {taxIdType === 'cpf' ? 'CNPJ' : 'CPF'})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={taxIdType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Finalizar cadastro"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="text-center text-sm text-gray-500">
        <p>
          Já tem uma conta?{" "}
          <Button variant="link" className="p-0" onClick={() => navigate("/login")}>
            Faça login
          </Button>
        </p>
      </div>
    </div>
  );
};
