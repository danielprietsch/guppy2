
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { debugError } from "@/utils/debugLogger";

interface LocationApproval {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  status: string;
  created_at: string;
}

const AdminDashboardPage = () => {
  const [pendingLocations, setPendingLocations] = useState<LocationApproval[]>([]);

  const fetchPendingLocations = async () => {
    const { data: locations, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        address,
        city,
        state,
        admin_approvals!inner (
          status, 
          created_at
        )
      `)
      .eq('admin_approvals.status', 'PENDENTE');

    if (error) {
      debugError("AdminDashboardPage: Error fetching locations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os locais pendentes",
        variant: "destructive",
      });
      return;
    }

    // Transform the data to match our LocationApproval interface
    const formattedLocations = locations?.map(location => ({
      id: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      status: location.admin_approvals[0]?.status || 'PENDENTE',
      created_at: location.admin_approvals[0]?.created_at || new Date().toISOString()
    })) || [];

    setPendingLocations(formattedLocations);
  };

  const handleApprove = async (locationId: string) => {
    const { error: updateError } = await supabase
      .from('locations')
      .update({ active: true })
      .eq('id', locationId);

    if (updateError) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o local",
        variant: "destructive",
      });
      return;
    }

    const { error: approvalError } = await supabase
      .from('admin_approvals')
      .update({ 
        status: 'APROVADO',
        approved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('location_id', locationId);

    if (approvalError) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da aprovação",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Local aprovado com sucesso",
    });

    fetchPendingLocations();
  };

  useEffect(() => {
    fetchPendingLocations();
  }, []);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard do Administrador</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Locais Pendentes de Aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingLocations.length === 0 ? (
              <p className="text-muted-foreground">Não há locais pendentes de aprovação.</p>
            ) : (
              <div className="space-y-4">
                {pendingLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{location.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {location.address}, {location.city}, {location.state}
                      </p>
                    </div>
                    <Button onClick={() => handleApprove(location.id)}>
                      Aprovar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
