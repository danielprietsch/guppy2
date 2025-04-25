
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

const PrivacySettingsCard = () => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchPrivacySettings = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_public')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) throw error;
        setIsPublic(data?.is_public ?? true);
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas configurações",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrivacySettings();
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [user]);

  const handleTogglePrivacy = async (value: string) => {
    if (!user || !value) return;
    
    const newIsPublic = value === 'available';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_public: newIsPublic })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsPublic(newIsPublic);
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      
      toast({
        title: "Status Atualizado",
        description: newIsPublic 
          ? "Você está disponível para novos agendamentos." 
          : "Você está indisponível para novos agendamentos.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua disponibilidade",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <Label className="text-lg font-medium mb-4 block">
          Disponibilidade para Agendamentos
        </Label>
        <ToggleGroup
          type="single"
          defaultValue={isPublic ? 'available' : 'unavailable'} 
          value={isPublic ? 'available' : 'unavailable'}
          onValueChange={handleTogglePrivacy}
          className="grid grid-cols-2 gap-4"
        >
          <ToggleGroupItem 
            value="available" 
            aria-label="Disponível"
            className="flex flex-col items-center justify-between p-6 rounded-xl data-[state=on]:bg-[#F2FCE2] h-48"
          >
            <div className="bg-green-100 rounded-full p-4 mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">Disponível</div>
              <p className="text-sm text-muted-foreground">
                Visível para todos os clientes
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Seus serviços estarão disponíveis para reserva
              </p>
            </div>
          </ToggleGroupItem>
          
          <ToggleGroupItem 
            value="unavailable"
            aria-label="Indisponível"
            className="flex flex-col items-center justify-between p-6 rounded-xl data-[state=on]:bg-[#F1F0FB] h-48"
          >
            <div className="bg-red-100 rounded-full p-4 mb-4">
              <X className="h-12 w-12 text-red-600" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">Indisponível</div>
              <p className="text-sm text-muted-foreground">
                Oculto para novos clientes
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Não receberá novos agendamentos
              </p>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsCard;
