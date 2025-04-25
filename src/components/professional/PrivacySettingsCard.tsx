import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface PrivacySettingsCardProps {
  initialIsPublic?: boolean;
}

const PrivacySettingsCard = ({ initialIsPublic = true }: PrivacySettingsCardProps) => {
  const { user } = useAuth();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const updates = {
        user_type: user.user_type
      };

      const { data: metadataData, error: metadataError } = await supabase.auth.updateUser({
        data: { isPublic }
      });
      
      if (metadataError) throw metadataError;
      
      toast({
        title: "Configurações de privacidade atualizadas",
        description: isPublic 
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Configurações de Privacidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Escolha se seu perfil estará visível para os clientes nas pesquisas.
          </p>
          
          <RadioGroup
            value={isPublic ? "public" : "private"}
            onValueChange={(value) => setIsPublic(value === "public")}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-accent">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Perfil Público</p>
                  <p className="text-sm text-muted-foreground">
                    Seu perfil e calendário de disponibilidade estarão visíveis para os clientes.
                  </p>
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-accent">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex-1 cursor-pointer">
                <div>
                  <p className="font-medium">Perfil Privado</p>
                  <p className="text-sm text-muted-foreground">
                    Seu perfil não aparecerá nas pesquisas de clientes.
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleSave} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacySettingsCard;
