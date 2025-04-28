
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@/lib/types";

interface PrivacySettingsCardProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const PrivacySettingsCard = ({ currentUser, setCurrentUser }: PrivacySettingsCardProps) => {
  const [isPublic, setIsPublic] = useState(true);
  const [hasOwnLocation, setHasOwnLocation] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setIsPublic(currentUser.is_public ?? true);
      setHasOwnLocation(currentUser.hasOwnLocation ?? false);
    }
  }, [currentUser]);

  const handleTogglePublic = async () => {
    try {
      const { error } = await supabase.rpc('update_profile_visibility', {
        user_id: currentUser.id,
        is_public: !isPublic
      });

      if (error) throw error;

      setIsPublic(!isPublic);
      setCurrentUser(prev => prev ? { ...prev, is_public: !isPublic } : null);
      
      toast({
        title: "Visibilidade atualizada",
        description: !isPublic 
          ? "Seu perfil agora está visível para todos" 
          : "Seu perfil agora está privado",
      });
    } catch (error: any) {
      console.error("Error updating profile visibility:", error);
      toast({
        title: "Erro ao atualizar visibilidade",
        description: error.message || "Ocorreu um erro ao atualizar a visibilidade do perfil",
        variant: "destructive",
      });
    }
  };

  const handleToggleOwnLocation = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_own_location: !hasOwnLocation })
        .eq('id', currentUser.id);

      if (error) throw error;

      setHasOwnLocation(!hasOwnLocation);
      setCurrentUser(prev => prev ? { ...prev, hasOwnLocation: !hasOwnLocation } : null);
      
      toast({
        title: "Configuração atualizada",
        description: !hasOwnLocation 
          ? "Você agora pode oferecer serviços no seu próprio local" 
          : "Você não está mais oferecendo serviços no seu próprio local",
      });
    } catch (error: any) {
      console.error("Error updating own location status:", error);
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message || "Ocorreu um erro ao atualizar a configuração de local próprio",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Privacidade</CardTitle>
        <CardDescription>
          Gerencie a visibilidade do seu perfil e suas configurações de atendimento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="public-profile" className="flex flex-col space-y-1">
            <span>Perfil público</span>
            <span className="font-normal text-sm text-muted-foreground">
              Seu perfil ficará visível para todos os clientes
            </span>
          </Label>
          <Switch
            id="public-profile"
            checked={isPublic}
            onCheckedChange={handleTogglePublic}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="own-location" className="flex flex-col space-y-1">
            <span>Local próprio para atendimento</span>
            <span className="font-normal text-sm text-muted-foreground">
              Indique se você possui um local próprio para realizar atendimentos
            </span>
          </Label>
          <Switch
            id="own-location"
            checked={hasOwnLocation}
            onCheckedChange={handleToggleOwnLocation}
          />
        </div>
      </CardContent>
    </Card>
  );
};
