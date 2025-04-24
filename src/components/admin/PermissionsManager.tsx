
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

// Define the shape of data returned from the get_all_users RPC function
type GetAllUsersResponse = {
  id: string;
  email: string;
  name: string;
  user_type: string;
}[];

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
        
        // Using the security definer function to fetch users via RPC
        // Providing both required type parameters for rpc
        const { data: userData, error: userError } = await supabase.rpc<GetAllUsersResponse, null>('get_all_users');
        
        if (userError) {
          debugError("PermissionsManager: Error fetching users:", userError);
          toast({
            title: "Erro",
            description: "Não foi possível carregar os usuários.",
            variant: "destructive",
          });
          return;
        }
        
        // Ensure we're setting an array of User objects
        setUsers(userData as User[] || []);
        
        // Fetch user permissions from the user_roles table
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
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
      
      const currentUserId = (await supabase.auth.getSession()).data.session?.user?.id;
      
      if (!currentUserId) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar as permissões.",
          variant: "destructive",
        });
        return;
      }
      
      // First, delete all existing permissions for these users
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .in('user_id', users.map(user => user.id));
        
      if (deleteError) {
        throw deleteError;
      }
      
      // Then insert the new permissions
      if (userPermissions.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(
            userPermissions.map(up => ({
              user_id: up.user_id,
              role: up.permission_id
            }))
          );
          
        if (insertError) {
          throw insertError;
        }
      }
      
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

