import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, Eye, EyeOff, PlusCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Location, Cabin } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

interface LocationsOverviewProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
  onAddCabinClick: () => void;
}

export const LocationsOverview = ({ 
  selectedLocation,
  locationCabins,
  onAddCabinClick
}: LocationsOverviewProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleToggleVisibility = async () => {
    if (!selectedLocation) return;
    
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('locations')
        .update({ active: !selectedLocation.active })
        .eq('id', selectedLocation.id);

      if (error) {
        debugError("LocationsOverview: Error updating location status:", error);
        toast({
          title: "Erro",
          description: "Não foi possível alterar a visibilidade do local.",
          variant: "destructive",
        });
        return;
      }

      // Reload the page to update the location status
      window.location.reload();
      
    } catch (error) {
      debugError("LocationsOverview: Error toggling visibility:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a visibilidade do local.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!selectedLocation) return null;
  
  return (
    <div className="space-y-6">
      {/* Location Details Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <div className="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={selectedLocation.imageUrl} 
                  alt={selectedLocation.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{selectedLocation.name}</h2>
                <p className="text-muted-foreground mb-4">
                  {selectedLocation.address}, {selectedLocation.city}-{selectedLocation.state}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Horário de Funcionamento</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.openingHours.open} - {selectedLocation.openingHours.close}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Número de Cabines</p>
                    <p className="text-sm text-muted-foreground">{locationCabins.length}</p>
                  </div>
                </div>
                {selectedLocation.amenities.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Comodidades</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.amenities.map((amenity, index) => (
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
                    variant={selectedLocation.active ? "default" : "secondary"}
                    className={selectedLocation.active ? "bg-green-500" : ""}
                  >
                    {selectedLocation.active ? "VISÍVEL" : "OCULTO"}
                  </Badge>
                </div>
                
                <Button 
                  onClick={handleToggleVisibility}
                  disabled={isUpdatingStatus}
                  variant="outline"
                  className={selectedLocation.active ? "border-red-500 text-red-500 hover:bg-red-50" : "border-green-500 text-green-500 hover:bg-green-50"}
                >
                  {isUpdatingStatus ? (
                    "Atualizando..."
                  ) : selectedLocation.active ? (
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

      {/* Metrics Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-soft-blue/20">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-soft-blue p-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">R$ 0</p>
                <p className="text-xs text-muted-foreground text-center">Receita (Mês)</p>
              </CardContent>
            </Card>
            
            <Card className="bg-soft-green/20">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-soft-green p-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold">R$ 0</p>
                <p className="text-xs text-muted-foreground text-center">Receita (Semana)</p>
              </CardContent>
            </Card>
            
            <Card className="bg-soft-purple/20">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-soft-purple p-2 mb-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground text-center">Reservas Hoje</p>
              </CardContent>
            </Card>
            
            <Card className="bg-soft-orange/20">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <div className="rounded-full bg-soft-orange p-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{locationCabins.length}</p>
                <p className="text-xs text-muted-foreground text-center">Cabines</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Add Cabin Card */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Cabine</CardTitle>
          <CardDescription>
            Cadastre uma nova cabine neste local para expandir seu negócio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="default"
            className="w-full bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            onClick={onAddCabinClick}
          >
            <PlusCircle className="mr-2" />
            Cadastrar Nova Cabine
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
