import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { debugLog, debugError } from "@/utils/debugLogger";

type LocationApproval = {
  id: string;
  location_id: string;
  location_name: string;
  owner_name: string;
  owner_email: string;
  status: "PENDENTE" | "APROVADO" | "REJEITADO";
  created_at: string;
  notes?: string;
};

export const LocationApprovals = () => {
  const [approvals, setApprovals] = useState<LocationApproval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('admin_approvals')
        .select(`
          *,
          location:locations(
            name,
            owner_id
          )
        `);
      
      if (approvalsError) {
        debugError("LocationApprovals: Error fetching approvals:", approvalsError);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as solicitações de aprovação.",
          variant: "destructive",
        });
        return;
      }

      // Now, fetch owner details for each location
      const approvalsList = await Promise.all((approvalsData || []).map(async (approval) => {
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', approval.location.owner_id)
          .single();
          
        if (ownerError) {
          debugError(`LocationApprovals: Error fetching owner for location ${approval.location_id}:`, ownerError);
          return {
            id: approval.id,
            location_id: approval.location_id,
            location_name: approval.location.name,
            owner_name: "Desconhecido",
            owner_email: "Desconhecido",
            status: (approval.status || "PENDENTE") as "PENDENTE" | "APROVADO" | "REJEITADO",
            created_at: approval.created_at,
            notes: approval.notes
          };
        }
        
        return {
          id: approval.id,
          location_id: approval.location_id,
          location_name: approval.location.name,
          owner_name: ownerData?.name || "Desconhecido",
          owner_email: ownerData?.email || "Desconhecido",
          status: (approval.status || "PENDENTE") as "PENDENTE" | "APROVADO" | "REJEITADO",
          created_at: approval.created_at,
          notes: approval.notes
        };
      }));
      
      setApprovals(approvalsList);
      
    } catch (error) {
      debugError("LocationApprovals: Error in fetchApprovals:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string, locationId: string) => {
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
      
      const { error } = await supabase
        .from('admin_approvals')
        .update({ 
          status: 'APROVADO',
          approved_by: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);
        
      if (error) {
        debugError("LocationApprovals: Error approving location:", error);
        toast({
          title: "Erro",
          description: "Não foi possível aprovar o local.",
          variant: "destructive",
        });
        return;
      }
      
      // Also update the location's active status
      const { error: locationError } = await supabase
        .from('locations')
        .update({ active: true })
        .eq('id', locationId);
        
      if (locationError) {
        debugError("LocationApprovals: Error activating location:", locationError);
        toast({
          title: "Atenção",
          description: "Local aprovado, mas não foi possível ativá-lo automaticamente.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Sucesso",
        description: "Local aprovado com sucesso.",
      });
      
      // Refresh the approvals list
      fetchApprovals();
      
    } catch (error) {
      debugError("LocationApprovals: Error in handleApprove:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao aprovar o local.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (approvalId: string) => {
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
      
      // For now, we'll just update the status to REJEITADO
      // In a real implementation, you might want to ask for rejection reason
      const { error } = await supabase
        .from('admin_approvals')
        .update({ 
          status: 'REJEITADO',
          approved_by: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', approvalId);
        
      if (error) {
        debugError("LocationApprovals: Error rejecting location:", error);
        toast({
          title: "Erro",
          description: "Não foi possível rejeitar o local.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Sucesso",
        description: "Local rejeitado com sucesso.",
      });
      
      // Refresh the approvals list
      fetchApprovals();
      
    } catch (error) {
      debugError("LocationApprovals: Error in handleReject:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao rejeitar o local.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aprovação de Locais</CardTitle>
        <CardDescription>
          Gerencie as solicitações de aprovação de locais
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Carregando solicitações...</p>
        ) : approvals.length === 0 ? (
          <p className="text-center py-4">Não há solicitações de aprovação pendentes.</p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>{approval.location_name}</TableCell>
                    <TableCell>
                      <div>{approval.owner_name}</div>
                      <div className="text-xs text-muted-foreground">{approval.owner_email}</div>
                    </TableCell>
                    <TableCell>
                      {new Date(approval.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {approval.status === "APROVADO" ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" /> APROVADO
                        </Badge>
                      ) : approval.status === "REJEITADO" ? (
                        <Badge variant="destructive">
                          <XCircle className="h-4 w-4 mr-1" /> REJEITADO
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                          PENDENTE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {approval.status === "PENDENTE" && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                            onClick={() => handleApprove(approval.id, approval.location_id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleReject(approval.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                          </Button>
                        </div>
                      )}
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
