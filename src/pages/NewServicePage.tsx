
import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Loader2, Save } from "lucide-react";
import SpecialtyCard from "@/components/SpecialtyCard";
import { serviceData } from "@/utils/serviceData";

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
  services: z.array(z.object({
    id: z.string(),
    price: z.number().min(1, "O preço deve ser maior que zero"),
    duration: z.number().min(1, "A duração deve ser maior que zero")
  })).min(1, "Selecione pelo menos um serviço para se tornar elegível nas pesquisas"),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const NewServicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<{ id: string; price: number; duration: number; }[]>([]);
  const [showWarning, setShowWarning] = useState(true);

  // Update warning visibility based on selected services
  useEffect(() => {
    if (selectedServices.length > 0) {
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  }, [selectedServices]);

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
        description: "Você precisa estar logado para criar serviços",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Insert each service as a separate row
      for (const service of selectedServices) {
        const { error } = await supabase
          .from("services")
          .insert({
            professional_id: user.id,
            name: availableServices.find(s => s.id === service.id)?.label || '',
            description: getServiceDescription(service.id),
            duration: service.duration,
            price: service.price,
            category: getServiceCategory(service.id)
          });

        if (error) throw error;
      }

      toast({
        title: "Serviços cadastrados",
        description: "Seus serviços foram cadastrados com sucesso! Agora você está elegível para aparecer nas pesquisas.",
      });

      navigate("/professional/dashboard");
    } catch (error: any) {
      console.error("Error creating services:", error);
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

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    if (checked) {
      const serviceInfo = serviceData[serviceId as keyof typeof serviceData];
      setSelectedServices(prev => [...prev, { 
        id: serviceId, 
        price: serviceInfo?.price || 50, 
        duration: serviceInfo?.duration || 30 
      }]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
    }
  };

  const updateServiceDetails = (serviceId: string, price: number, duration: number) => {
    setSelectedServices(prev => 
      prev.map(service => 
        service.id === serviceId ? { ...service, price, duration } : service
      )
    );
  };

  const getServiceCategory = (id: string) => {
    if (id.includes("corte") || id.includes("cabelo") || id.includes("escova") || id.includes("hidratacao")) return "Cabelo";
    if (id.includes("manicure") || id.includes("pedicure")) return "Mãos e Pés";
    if (id.includes("maquiagem")) return "Maquiagem";
    if (id.includes("depilacao")) return "Depilação";
    if (id.includes("barba")) return "Barba";
    if (id.includes("massagem") || id.includes("limpeza")) return "Bem-estar";
    return "Outros";
  };

  const getServiceDescription = (id: string) => {
    const service = availableServices.find(s => s.id === id);
    if (!service) return "";
    return service.label;
  };

  return (
    <div className="container max-w-7xl py-12">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">Novos Serviços</h1>
      </div>

      {showWarning && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-6">
          <p className="text-sm font-medium">
            Selecione pelo menos um serviço para se tornar elegível nas pesquisas
          </p>
        </div>
      )}

      {/* Sticky Save button at top of page for better visibility */}
      <div className="sticky top-4 z-10 flex justify-end mb-6">
        <Button 
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || selectedServices.length === 0}
          className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold px-8 py-6 text-lg shadow-lg"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Salvar Serviços
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione seus serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableServices.map((service) => {
                  const selectedService = selectedServices.find(s => s.id === service.id);
                  return (
                    <div key={service.id}>
                      <SpecialtyCard
                        id={service.id}
                        label={service.label}
                        checked={!!selectedService}
                        onCheckedChange={(checked) => handleServiceToggle(service.id, checked)}
                        price={selectedService?.price}
                        duration={selectedService?.duration}
                        onPriceChange={(price) => selectedService && updateServiceDetails(service.id, price, selectedService.duration)}
                        onDurationChange={(duration) => selectedService && updateServiceDetails(service.id, selectedService.price, duration)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Large, prominent save button at bottom of page as well */}
              <div className="flex justify-center pt-8">
                <Button 
                  type="submit"
                  disabled={isSubmitting || selectedServices.length === 0}
                  className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold px-10 py-6 text-lg shadow-lg w-full md:w-1/2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Salvando Serviços...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-5 w-5" />
                      Salvar Serviços
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewServicePage;
