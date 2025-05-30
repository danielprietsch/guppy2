
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { debugLog, debugError } from "@/utils/debugLogger";

type LocationListItem = {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  active: boolean;
  cabins_count: number;
  created_at: string;
};

export const LocationApprovals = () => {
  const [locations, setLocations] = useState<LocationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Fetch all locations with owner details
      debugLog("LocationApprovals: Starting to fetch locations");
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          active,
          created_at,
          owner_id
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        debugError("LocationApprovals: Error fetching locations:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os locais.",
          variant: "destructive",
        });
        return;
      }

      if (!data || data.length === 0) {
        setLocations([]);
        setLoading(false);
        return;
      }

      // Transformação para locationsWithDetails com contagem de cabines atual
      const locationsWithDetails = await Promise.all((data || []).map(async (location) => {
        // SOLUÇÃO DEFINITIVA: Obter contagem direta de cabines da tabela para cada localização
        const { count: realCabinsCount, error: cabinsError } = await supabase
          .from('cabins')
          .select('*', { count: "exact", head: true })
          .eq('location_id', location.id);
          
        if (cabinsError) {
          debugError(`LocationApprovals: Error getting cabins count for location ${location.id}:`, cabinsError);
        }
        
        // Obter dados do proprietário
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', location.owner_id)
          .single();
        
        if (profileError) {
          debugError(`LocationApprovals: Error fetching profile for location ${location.id}:`, profileError);
        }
        
        // Sempre use a contagem real obtida diretamente da tabela de cabines
        const actualCabinsCount = cabinsError ? 0 : (realCabinsCount || 0);
        
        // Se a contagem no registro da location está incorreta, atualize-a
        if (actualCabinsCount !== 0) {
          const { error: updateError } = await supabase
            .from('locations')
            .update({ cabins_count: actualCabinsCount })
            .eq('id', location.id);
            
          if (updateError) {
            debugError(`LocationApprovals: Error updating location cabins count for ${location.id}:`, updateError);
          }
        }
        
        return {
          id: location.id,
          name: location.name,
          active: location.active,
          cabins_count: actualCabinsCount,
          created_at: location.created_at,
          owner_name: profileData?.name || "Desconhecido",
          owner_email: profileData?.email || "Desconhecido"
        };
      }));
      
      setLocations(locationsWithDetails);
      
    } catch (error) {
      debugError("LocationApprovals: Error in fetchLocations:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLocations();
  };

  const handleToggleVisibility = async (locationId: string, currentStatus: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para realizar esta ação.",
          variant: "destructive",
        });
        return;
      }
      
      debugLog(`LocationApprovals: Toggling location visibility for ${locationId} to ${!currentStatus}`);
      const { error } = await supabase
        .from('locations')
        .update({ active: !currentStatus })
        .eq('id', locationId);
        
      if (error) {
        debugError("LocationApprovals: Error toggling location visibility:", error);
        toast({
          title: "Erro",
          description: "Não foi possível alterar a visibilidade do local.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Sucesso",
        description: `Local ${!currentStatus ? 'ativado' : 'desativado'} com sucesso.`,
      });
      
      // Update local state
      setLocations(prevLocations => 
        prevLocations.map(loc => 
          loc.id === locationId ? { ...loc, active: !currentStatus } : loc
        )
      );
      
    } catch (error) {
      debugError("LocationApprovals: Error in handleToggleVisibility:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar a visibilidade do local.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestão de Locais</CardTitle>
          <CardDescription>
            Gerencie a visibilidade dos locais na plataforma
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Carregando locais...</p>
        ) : locations.length === 0 ? (
          <p className="text-center py-4">Não há locais cadastrados.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Cabines</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>
                      <div>{location.owner_name}</div>
                      <div className="text-xs text-muted-foreground">{location.owner_email}</div>
                    </TableCell>
                    <TableCell>{location.cabins_count}</TableCell>
                    <TableCell>
                      {new Date(location.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {location.active ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <Eye className="h-4 w-4 mr-1" /> VISÍVEL
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-4 w-4 mr-1" /> OCULTO
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={location.active ? 
                          "border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600" : 
                          "border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                        }
                        onClick={() => handleToggleVisibility(location.id, location.active)}
                      >
                        {location.active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" /> Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" /> Tornar Visível
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
