
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

// Define prop types for the component
interface PrivacySettingsCardProps {
  // Make initialIsPublic optional with a default value
  initialIsPublic?: boolean;
}

const PrivacySettingsCard = ({ initialIsPublic }: PrivacySettingsCardProps = {}) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(initialIsPublic ?? true);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Privacy settings loading timeout reached, using default value");
        setIsLoading(false);
        // Use default value if loading takes too long
      }
    }, 5000); // 5 second timeout

    const fetchPrivacySettings = async () => {
      if (!user) {
        console.log("No user found in PrivacySettingsCard, aborting fetch");
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Fetching privacy settings for user:", user.id);
        
        // Direct query to profiles table to get is_public status
        const { data, error } = await supabase
          .from('profiles')
          .select('is_public')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error("Error fetching privacy settings:", error);
          throw error;
        }
        
        console.log("Privacy settings data received:", data);
        
        // If we got data back, use it; otherwise default to true
        if (data) {
          setIsPublic(data.is_public !== false); // Default to true if null
        }
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

    // Clean up the timeout
    return () => clearTimeout(loadingTimeout);
  }, [user]);

  const handleTogglePrivacy = async (value: string) => {
    if (!user) return;
    
    const newIsPublic = value === 'available';
    
    try {
      console.log("Updating profile visibility to:", newIsPublic);
      
      // Direct update to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ is_public: newIsPublic })
        .eq('id', user.id);
      
      if (error) {
        console.error("Error updating visibility:", error);
        throw error;
      }
      
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
          <div className="text-center">Carregando configurações de privacidade...</div>
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
            className="flex flex-col items-center justify-between gap-4 p-8 h-full min-h-[320px] data-[state=on]:bg-[#F2FCE2] border-2 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
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
            className="flex flex-col items-center justify-between gap-4 p-8 h-full min-h-[320px] data-[state=on]:bg-[#F1F0FB] border-2 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
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
