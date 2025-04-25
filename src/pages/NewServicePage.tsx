
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import SpecialtyCard from "@/components/SpecialtyCard";

const availableServices = [
  { id: "corte_cabelo", label: "Corte de Cabelo" },
  { id: "coloracao", label: "Coloração" },
  { id: "luzes", label: "Luzes/Mechas" },
  { id: "escova", label: "Escova/Brushing" },
  { id: "hidratacao", label: "Hidratação Capilar" },
  { id: "manicure_comum", label: "Manicure Tradicional" },
  { id: "manicure_gel", label: "Unha em Gel" },
  { id: "pedicure_comum", label: "Pedicure Tradicional" },
  { id: "pedicure_spa", label: "Pedicure com SPA" },
  { id: "maquiagem_social", label: "Maquiagem Social" },
  { id: "maquiagem_noiva", label: "Maquiagem para Noiva" },
  { id: "design_sobrancelhas", label: "Design de Sobrancelhas" },
  { id: "barba", label: "Barba" },
  { id: "depilacao_cera", label: "Depilação com Cera" },
  { id: "depilacao_laser", label: "Depilação a Laser" },
  { id: "massagem_relaxante", label: "Massagem Relaxante" },
  { id: "limpeza_pele", label: "Limpeza de Pele" },
];

const serviceSchema = z.object({
  services: z.array(z.string()).min(1, "Selecione pelo menos um serviço para se tornar elegível nas pesquisas"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const NewServicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      services: [],
    },
  });

  const onSubmit = async (values: ServiceFormValues) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um serviço",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: serviceData, error } = await supabase
        .from("services")
        .insert({
          professional_id: user.id,
          specialties: values.services,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Serviços cadastrados",
        description: "Seus serviços foram cadastrados com sucesso! Agora você está elegível para aparecer nas pesquisas.",
      });

      navigate("/professional/dashboard");
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast({
        title: "Erro ao cadastrar serviços",
        description: error.message || "Ocorreu um erro ao cadastrar os serviços. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="container max-w-7xl py-12">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Novos Serviços</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione seus serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableServices.map((service) => (
                  <div key={service.id}>
                    <SpecialtyCard
                      id={service.id}
                      label={service.label}
                      checked={form.watch("services")?.includes(service.id)}
                      onCheckedChange={(checked) => {
                        const currentServices = form.getValues("services") || [];
                        if (checked) {
                          form.setValue("services", [...currentServices, service.id]);
                        } else {
                          form.setValue(
                            "services",
                            currentServices.filter((id) => id !== service.id)
                          );
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Serviços'
                  )}
                </Button>
              </div>

              {form.formState.errors.services && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.services.message}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewServicePage;
