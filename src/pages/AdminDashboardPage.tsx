
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationApprovals } from "@/components/admin/LocationApprovals";
import { PermissionsManager } from "@/components/admin/PermissionsManager";
import { GlobalAdminProfileForm } from "@/components/admin/GlobalAdminProfileForm";
import { User } from "@/lib/types";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("locations");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        debugLog("AdminDashboardPage: Checking admin status...");
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          debugLog("AdminDashboardPage: No active session");
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        debugLog("AdminDashboardPage: Session found, user:", session.user);
        
        const { data: isGlobalAdmin, error: adminCheckError } = await supabase
          .rpc('is_global_admin', { user_id: session.user.id });
          
        if (adminCheckError) {
          debugError("AdminDashboardPage: Error checking admin status:", adminCheckError);
          throw new Error("Erro ao verificar status de administrador");
        }
        
        if (!isGlobalAdmin) {
          debugLog("AdminDashboardPage: User is not an admin");
          toast({
            title: "Acesso negado",
            description: "Você não tem permissão para acessar o painel de administrador.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        debugLog("AdminDashboardPage: User is confirmed as admin");
        setIsAdmin(true);
        
        // Fetch user profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          debugError("AdminDashboardPage: Error fetching user profile:", profileError);
        } else if (profileData) {
          // Create user object from profile data
          setCurrentUser({
            id: profileData.id,
            name: profileData.name || session.user.email?.split('@')[0] || "Admin",
            email: profileData.email || session.user.email || "",
            userType: "global_admin",
            avatarUrl: profileData.avatar_url,
            phoneNumber: profileData.phone_number
          });
        }
      } catch (error) {
        debugError("AdminDashboardPage: Error:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao verificar suas permissões.",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
            <p className="text-muted-foreground">Verificando suas permissões...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    return null; // This will not render as navigate in useEffect will redirect
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-8">Painel de Administrador</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="locations">Locais</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
        </TabsList>
        
        <TabsContent value="locations" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Locais</CardTitle>
              <CardDescription>
                Visualize e gerencie a visibilidade dos locais na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LocationApprovals />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="permissions" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Permissões</CardTitle>
              <CardDescription>
                Atribua e remova permissões dos usuários na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsManager />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil de Administrador</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentUser && (
                <GlobalAdminProfileForm 
                  currentUser={currentUser} 
                  setCurrentUser={setCurrentUser} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
