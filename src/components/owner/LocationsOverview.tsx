import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, PlusCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Location, Cabin } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { triggerApprovalRequest } from "@/utils/triggerApprovalRequest";
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
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [isRequestingApproval, setIsRequestingApproval] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedLocation) {
      setIsLoading(true);
      debugLog("LocationsOverview: Location changed, fetching approval status for:", selectedLocation.id);
      fetchApprovalStatus();
    }
  }, [selectedLocation]);

  const fetchApprovalStatus = async () => {
    if (!selectedLocation) return;
    
    try {
      debugLog("LocationsOverview: Fetching approval status for location", selectedLocation.id);
      const { data, error } = await supabase
        .rpc('get_location_approval_status', { loc_id: selectedLocation.id });
        
      if (error) {
        debugError("LocationsOverview: Error fetching approval status:", error);
        toast({
          title: "Erro",
          description: "Não foi possível verificar o status de aprovação do local.",
          variant: "destructive",
        });
        return;
      }
      
      if (data && data.length > 0) {
        debugLog("LocationsOverview: Approval status found:", data[0].status);
        setApprovalStatus(data[0].status);
      } else {
        debugLog("LocationsOverview: No approval status found");
        setApprovalStatus(null);
      }
    } catch (error) {
      debugError("LocationsOverview: Error in fetchApprovalStatus:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!selectedLocation) {
      debugLog("LocationsOverview: No location selected, cannot request approval");
      return;
    }
    
    // Log cabins count before validation
    debugLog("LocationsOverview: Cabins count before validation:", locationCabins.length);
    
    // Validate that there's at least one cabin
    if (locationCabins.length === 0) {
      debugLog("LocationsOverview: Validation failed - No cabins");
      toast({
        title: "Erro",
        description: "É necessário cadastrar pelo menos uma cabine antes de solicitar aprovação.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRequestingApproval(true);
    debugLog("LocationsOverview: Starting approval request for location", selectedLocation.id);
    
    try {
      // Log parameters being sent to triggerApprovalRequest
      debugLog("LocationsOverview: Calling triggerApprovalRequest with params:", {
        locationId: selectedLocation.id, 
        cabinsCount: locationCabins.length
      });
      
      const result = await triggerApprovalRequest(selectedLocation.id, locationCabins.length);
      
      // Enhanced logging of the result
      debugLog("LocationsOverview: Approval request result:", JSON.stringify(result));
      
      if (result.success) {
        debugLog("LocationsOverview: Approval request was successful");
        // Immediate update for better UX
        setApprovalStatus("PENDENTE");
        // Then fetch from server to confirm
        await fetchApprovalStatus();
      } else {
        // Log specific failure messages
        if (result.message === "no-cabins") {
          debugLog("LocationsOverview: Approval request failed - No cabins");
        } else if (result.message === "already-approved") {
          debugLog("LocationsOverview: Local already approved");
        } else if (result.message === "already-pending") {
          debugLog("LocationsOverview: Approval already pending");
        } else {
          debugLog("LocationsOverview: Approval request failed with message:", result.message);
          if (result.error) {
            debugError("LocationsOverview: Error details:", result.error);
          }
        }
      }
    } catch (error) {
      debugError("LocationsOverview: Error requesting approval:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao solicitar a aprovação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingApproval(false);
      debugLog("LocationsOverview: Request approval process completed");
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
                  {isLoading ? (
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  ) : approvalStatus === "APROVADO" ? (
                    <Badge className="bg-green-500">APROVADO</Badge>
                  ) : approvalStatus === "PENDENTE" ? (
                    <Badge variant="secondary" className="bg-yellow-500 text-white">AGUARDANDO APROVAÇÃO</Badge>
                  ) : approvalStatus === "REJEITADO" ? (
                    <Badge variant="destructive">REJEITADO</Badge>
                  ) : (
                    <Badge variant="outline">INATIVO</Badge>
                  )}
                </div>
                
                {(!approvalStatus || approvalStatus === "REJEITADO") && (
                  <Button 
                    onClick={handleRequestApproval}
                    disabled={isRequestingApproval || locationCabins.length === 0}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isRequestingApproval ? "Enviando..." : "Solicitar Aprovação do Local"}
                  </Button>
                )}
              </div>

              {locationCabins.length === 0 && (
                <Alert className="mt-4 border-blue-500/50 bg-blue-500/10">
                  <AlertDescription className="text-blue-800">
                    Cadastre pelo menos uma cabine para poder solicitar a aprovação do local.
                  </AlertDescription>
                </Alert>
              )}

              {approvalStatus === "PENDENTE" && (
                <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10">
                  <AlertDescription className="text-yellow-800">
                    Seu local está em análise. Você será notificado quando houver uma decisão.
                  </AlertDescription>
                </Alert>
              )}
              
              {approvalStatus === "REJEITADO" && (
                <Alert className="mt-4 border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-red-800">
                    Seu local foi rejeitado. Por favor, verifique as informações e tente novamente.
                  </AlertDescription>
                </Alert>
              )}
              
              {!selectedLocation.active && approvalStatus !== "APROVADO" && (
                <Alert className="mt-4">
                  <AlertDescription>
                    Este local não está visível para os usuários até ser aprovado por um administrador.
                  </AlertDescription>
                </Alert>
              )}
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
