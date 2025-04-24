import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Cabin } from "@/lib/types";
import { Json } from "@/integrations/supabase/types";
import { getPricesFromCalendar } from "../cabinUtils";
import { CabinFormState } from "../types/cabinTypes";
import { debugLog, debugError } from "@/utils/debugLogger";

export const useCabinCreation = (
  locationId: string,
  onCabinCreated?: (cabin: Cabin) => void,
  onSuccess?: () => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createCabin = async (formState: CabinFormState) => {
    if (!formState.name) {
      toast({ title: "Nome da cabine é obrigatório", variant: "destructive" });
      return;
    }
    
    if (!locationId) {
      toast({ title: "ID do local não fornecido", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      debugLog("useCabinCreation: Criando nova cabine para o local:", locationId);
      
      const pricing = getPricesFromCalendar(formState.precosPorDiaSemana, formState.precosPorDia);
      
      debugLog("useCabinCreation: Dados da cabine:", {
        location_id: locationId,
        name: formState.name,
        description: formState.description || "",
        equipment: formState.equipment || [],
        availability: formState.turnoDisponibilidade
      });
      
      const { data, error } = await supabase
        .from('cabins')
        .insert({
          location_id: locationId,
          name: formState.name,
          description: formState.description || "",
          equipment: formState.equipment || [],
          image_url: "",
          availability: formState.turnoDisponibilidade as unknown as Json,
          pricing: pricing as unknown as Json
        })
        .select()
        .single();
      
      if (error) {
        debugError("useCabinCreation: Erro ao adicionar cabine:", error);
        
        if (error.code === '23505') {
          toast({ 
            title: "Erro ao adicionar cabine", 
            description: "Já existe uma cabine com este nome neste local. Por favor, escolha um nome diferente.", 
            variant: "destructive" 
          });
          return;
        }
        
        toast({ title: "Erro ao adicionar cabine", description: error.message, variant: "destructive" });
        return;
      }
      
      debugLog("useCabinCreation: Cabine adicionada com sucesso:", data);
      
      // Atualizar o contador de cabines da localização usando uma chamada simples de update
      const { error: updateError } = await supabase
        .from('locations')
        .update({ cabins_count: supabase.rpc('increment', { row_id: locationId, table_name: 'locations', column_name: 'cabins_count' }) })
        .eq('id', locationId);
      
      if (updateError) {
        debugError("useCabinCreation: Erro ao atualizar contador de cabines:", updateError);
      }
      
      const novaCabine: Cabin = {
        id: data.id,
        locationId: data.location_id,
        name: data.name,
        description: data.description || "",
        equipment: data.equipment || [],
        imageUrl: data.image_url || "",
        availability: (data.availability as unknown as { morning: boolean; afternoon: boolean; evening: boolean }) || {
          morning: true,
          afternoon: true,
          evening: true
        },
        pricing: {
          defaultPricing: ((data.pricing as unknown as { defaultPricing: any })?.defaultPricing) || {},
          specificDates: ((data.pricing as unknown as { specificDates: any })?.specificDates) || {}
        }
      };
      
      if (onCabinCreated) {
        onCabinCreated(novaCabine);
      }
      
      toast({ title: "Cabine adicionada com sucesso!" });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error: any) {
      debugError("useCabinCreation: Erro ao processar adição de cabine:", error);
      toast({ 
        title: "Erro ao adicionar cabine", 
        description: error.message || "Erro desconhecido", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createCabin,
    isSubmitting
  };
};
