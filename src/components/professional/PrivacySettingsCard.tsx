
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, Clock } from "lucide-react";
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
    const fetchPrivacySettings = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_public')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setIsPublic(profile?.is_public ?? true);
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas configurações de privacidade",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrivacySettings();
  }, [user]);

  const handleTogglePrivacy = async (value: string) => {
    if (!user) return;
    
    const newIsPublic = value === 'available';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_public: newIsPublic,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setIsPublic(newIsPublic);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      
      toast({
        title: "Status Atualizado",
        description: newIsPublic 
          ? "Você está disponível para novos agendamentos." 
          : "Você está indisponível para novos agendamentos.",
      });
    } catch (error: any) {
      console.error("Error updating availability settings:", error);
      toast({
        title: "Erro ao atualizar disponibilidade",
        description: error.message || "Ocorreu um erro ao salvar suas configurações",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <Label className="text-lg font-medium mb-6 block">Disponibilidade para Agendamentos</Label>
        <ToggleGroup
          type="single"
          value={isPublic ? 'available' : 'unavailable'}
          onValueChange={handleTogglePrivacy}
          className="grid grid-cols-2 gap-6 h-full"
        >
          <ToggleGroupItem 
            value="available" 
            className="flex flex-col items-center justify-between gap-4 p-8 h-full min-h-[320px] data-[state=on]:bg-primary/10 border-2 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
          >
            <div className="p-6 rounded-full bg-primary/5 flex items-center justify-center">
              <Calendar className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-xl mb-2">Disponível</div>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Você está aceitando novos agendamentos
              </p>
            </div>
          </ToggleGroupItem>
          
          <ToggleGroupItem 
            value="unavailable"
            className="flex flex-col items-center justify-between gap-4 p-8 h-full min-h-[320px] data-[state=on]:bg-primary/10 border-2 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
          >
            <div className="p-6 rounded-full bg-primary/5 flex items-center justify-center">
              <Clock className="h-16 w-16 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-xl mb-2">Indisponível (Oculto)</div>
              <p className="text-sm text-muted-foreground max-w-[200px]">
                Você não está aceitando novos agendamentos
              </p>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsCard;
