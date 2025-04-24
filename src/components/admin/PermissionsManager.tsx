
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

type User = {
  id: string;
  email: string;
  name: string | null;
  user_type: string | null;
};

type Permission = {
  id: string;
  name: string;
  description: string;
};

type UserPermission = {
  user_id: string;
  permission_id: string;
};

export const PermissionsManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: "approve_locations", name: "Aprovar Locais", description: "Permite aprovar solicitações de locais" },
    { id: "manage_users", name: "Gerenciar Usuários", description: "Permite gerenciar usuários do sistema" },
    { id: "view_reports", name: "Visualizar Relatórios", description: "Permite visualizar relatórios do sistema" }
  ]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Fetch all users from the profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, name, user_type')
          .order('user_type', { ascending: true });
        
        if (error) {
          debugError("PermissionsManager: Error fetching users:", error);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os usuários.",
            variant: "destructive",
          });
          return;
        }

        setUsers(data || []);
        
        // In a real implementation, we would fetch permissions from a table
        // For now, we'll use the mock data defined in the state
        
        // Fetch user permissions from the user_roles table
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');
          
        if (rolesError) {
          debugError("PermissionsManager: Error fetching user roles:", rolesError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar as permissões dos usuários.",
            variant: "destructive",
          });
          return;
        }
        
        // Convert roles to permissions format
        const mappedPermissions: UserPermission[] = userRoles?.map((role) => ({
          user_id: role.user_id,
          permission_id: role.role
        })) || [];
        
        setUserPermissions(mappedPermissions);
        
      } catch (error) {
        debugError("PermissionsManager: Error in fetchUsers:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar os dados.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const hasPermission = (userId: string, permissionId: string) => {
    return userPermissions.some(
      (up) => up.user_id === userId && up.permission_id === permissionId
    );
  };

  const togglePermission = (userId: string, permissionId: string) => {
    setUserPermissions((prev) => {
      const exists = prev.some(
        (up) => up.user_id === userId && up.permission_id === permissionId
      );
      
      if (exists) {
        // Remove the permission
        return prev.filter(
          (up) => !(up.user_id === userId && up.permission_id === permissionId)
        );
      } else {
        // Add the permission
        return [...prev, { user_id: userId, permission_id: permissionId }];
      }
    });
  };

  const savePermissions = async () => {
    try {
      setSavingPermissions(true);
      
      // In a real implementation, we would need to:
      // 1. Delete all existing permissions for these users
      // 2. Insert the new permissions
      
      // Here we'll log the changes that would be made
      debugLog("PermissionsManager: Would save permissions:", userPermissions);
      
      // Mock successful save
      toast({
        title: "Sucesso",
        description: "Permissões atualizadas com sucesso.",
      });
      
    } catch (error) {
      debugError("PermissionsManager: Error saving permissions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as permissões.",
        variant: "destructive",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Permissões</CardTitle>
        <CardDescription>
          Configure as permissões para cada usuário do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4">Carregando permissões...</p>
        ) : (
          <>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Usuário</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    {permissions.map((permission) => (
                      <TableHead key={permission.id} className="text-center">
                        {permission.name}
                        <div className="text-xs font-normal text-muted-foreground">
                          {permission.description}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email || user.name}</TableCell>
                      <TableCell>
                        <span className="capitalize">{user.user_type}</span>
                      </TableCell>
                      {permissions.map((permission) => (
                        <TableCell key={`${user.id}-${permission.id}`} className="text-center">
                          <Checkbox
                            checked={hasPermission(user.id, permission.id)}
                            onCheckedChange={() => togglePermission(user.id, permission.id)}
                            id={`${user.id}-${permission.id}`}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button 
                onClick={savePermissions} 
                disabled={savingPermissions}
              >
                {savingPermissions ? "Salvando..." : "Salvar Permissões"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
