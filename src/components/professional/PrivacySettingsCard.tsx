import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Globe, Lock } from "lucide-react";
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
    
    const newIsPublic = value === 'public';
    
    try {
      const { data: metadataData, error: metadataError } = await supabase.auth.updateUser({
        data: { isPublic: newIsPublic }
      });
      
      if (metadataError) throw metadataError;
      
      setIsPublic(newIsPublic);
      toast({
        title: "Configurações de privacidade atualizadas",
        description: newIsPublic 
          ? "Seu perfil agora está visível para clientes." 
          : "Seu perfil agora está privado.",
      });
    } catch (error: any) {
      console.error("Error updating privacy settings:", error);
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message || "Ocorreu um erro ao salvar suas configurações",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <Label className="text-lg font-medium mb-6 block">Visibilidade do Perfil</Label>
        <ToggleGroup
          type="single"
          value={isPublic ? 'public' : 'private'}
          onValueChange={handleTogglePrivacy}
          className="grid grid-cols-2 gap-6"
        >
          <ToggleGroupItem 
            value="public" 
            className="flex flex-col items-center gap-4 p-8 data-[state=on]:bg-primary/10 border-2 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
          >
            <div className="p-4 rounded-full bg-primary/5">
              <Globe className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Público</div>
              <p className="text-sm text-muted-foreground">
                Visível para clientes
              </p>
            </div>
          </ToggleGroupItem>
          
          <ToggleGroupItem 
            value="private"
            className="flex flex-col items-center gap-4 p-8 data-[state=on]:bg-primary/10 border-2 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105"
          >
            <div className="p-4 rounded-full bg-primary/5">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">Privado</div>
              <p className="text-sm text-muted-foreground">
                Oculto para clientes
              </p>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsCard;
