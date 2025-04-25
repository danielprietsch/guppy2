import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface PrivacySettingsCardProps {
  initialIsPublic?: boolean;
}

const PrivacySettingsCard = ({ initialIsPublic = true }: PrivacySettingsCardProps) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!user) return;
      
      try {
        const { data: { user: userData } } = await supabase.auth.getUser();
        if (userData?.user_metadata?.isPublic !== undefined) {
          setIsPublic(userData.user_metadata.isPublic);
        } else {
          setIsPublic(initialIsPublic);
        }
      } catch (error) {
        console.error("Error fetching user metadata:", error);
      }
    };
    
    fetchPrivacySettings();
  }, [user, initialIsPublic]);

  const handleTogglePrivacy = async (value: string) => {
    if (!user) return;
    
    const newIsPublic = value === 'available';
    
    try {
      const { data: metadataData, error: metadataError } = await supabase.auth.updateUser({
        data: { isPublic: newIsPublic }
      });
      
      if (metadataError) throw metadataError;
      
      setIsPublic(newIsPublic);
      toast({
        title: "Disponibilidade Atualizada",
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
