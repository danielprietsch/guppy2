
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

  const handleTogglePrivacy = async () => {
    if (!user) return;
    
    try {
      const { data: metadataData, error: metadataError } = await supabase.auth.updateUser({
        data: { isPublic: !isPublic }
      });
      
      if (metadataError) throw metadataError;
      
      setIsPublic(!isPublic);
      toast({
        title: "Configurações de privacidade atualizadas",
        description: !isPublic 
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Globe className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5 text-primary" />
            )}
            <div>
              <h3 className="font-medium">Visibilidade do Perfil</h3>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? "Seu perfil está visível para os clientes"
                  : "Seu perfil está privado"}
              </p>
            </div>
          </div>
          <Switch
            checked={isPublic}
            onCheckedChange={handleTogglePrivacy}
            aria-label="Toggle profile visibility"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsCard;
