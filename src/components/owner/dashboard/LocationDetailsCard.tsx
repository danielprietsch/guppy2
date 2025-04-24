
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Location } from "@/lib/types";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";
import { memo } from "react";

interface LocationDetailsCardProps {
  location: Location;
}

export const LocationDetailsCard = memo(({ location }: LocationDetailsCardProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isActive, setIsActive] = useState(location.active);

  const handleToggleVisibility = async () => {
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('locations')
        .update({ active: !isActive })
        .eq('id', location.id);

      if (error) {
        debugError("LocationDetailsCard: Error updating location status:", error);
        toast({
          title: "Erro",
          description: "Não foi possível alterar a visibilidade do local.",
          variant: "destructive",
        });
        return;
      }

      setIsActive(!isActive);
      toast({
        title: "Sucesso",
        description: `Local ${!isActive ? "visível" : "ocultado"} com sucesso.`,
      });
      
    } catch (error) {
      debugError("LocationDetailsCard: Error toggling visibility:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a visibilidade do local.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex gap-6">
            <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={location.imageUrl} 
                alt={location.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{location.name}</h2>
              <p className="text-muted-foreground mb-4">
                {location.address}, {location.city}-{location.state}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Horário de Funcionamento</p>
                  <p className="text-sm text-muted-foreground">
                    {location.openingHours.open} - {location.openingHours.close}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Número de Cabines</p>
                  <p className="text-sm text-muted-foreground">{location.cabinsCount}</p>
                </div>
              </div>
              {location.amenities.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Comodidades</p>
                  <div className="flex flex-wrap gap-2">
                    {location.amenities.map((amenity, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Status do Local Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status do Local:</span>
                <Badge 
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-green-500" : ""}
                >
                  {isActive ? "VISÍVEL" : "OCULTO"}
                </Badge>
              </div>
              
              <Button 
                onClick={handleToggleVisibility}
                disabled={isUpdatingStatus}
                variant="outline"
                className={isActive ? "border-red-500 text-red-500 hover:bg-red-50" : "border-green-500 text-green-500 hover:bg-green-50"}
              >
                {isUpdatingStatus ? (
                  "Atualizando..."
                ) : isActive ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar Local
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Tornar Visível
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

LocationDetailsCard.displayName = "LocationDetailsCard";
