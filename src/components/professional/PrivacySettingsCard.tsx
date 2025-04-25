
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, Clock, Eye, EyeOff } from "lucide-react";
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
    if (!user) return;
    
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
          value={isPublic ? 'available' : 'unavailable'}
          onValueChange={handleTogglePrivacy}
          className="grid grid-cols-2 gap-4"
        >
          <ToggleGroupItem 
            value="available" 
            className="flex flex-col items-center justify-between p-4 rounded-xl data-[state=on]:bg-[#F2FCE2]"
          >
            <Eye className="h-8 w-8 text-primary mb-2" />
            <div className="text-center">
              <div className="font-semibold">Disponível</div>
              <p className="text-xs text-muted-foreground">
                Aceitando agendamentos
              </p>
            </div>
          </ToggleGroupItem>
          
          <ToggleGroupItem 
            value="unavailable"
            className="flex flex-col items-center justify-between p-4 rounded-xl data-[state=on]:bg-[#F1F0FB]"
          >
            <EyeOff className="h-8 w-8 text-primary mb-2" />
            <div className="text-center">
              <div className="font-semibold">Indisponível</div>
              <p className="text-xs text-muted-foreground">
                Não aceitando agendamentos
              </p>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsCard;
