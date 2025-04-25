
import { Navigate } from "react-router-dom";
import { useGlobalAdminProfile } from "@/hooks/useGlobalAdminProfile";
import { GlobalAdminProfileForm } from "@/components/admin/GlobalAdminProfileForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";
import { debugLog } from "@/utils/debugLogger";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

const GlobalAdminProfilePage = () => {
  const { currentUser, isLoading, error, updateProfile } = useGlobalAdminProfile();

  useEffect(() => {
    // Log user data for debugging when it changes
    if (currentUser) {
      debugLog("GlobalAdminProfilePage: User data updated:", { 
        id: currentUser.id, 
        avatarUrl: currentUser.avatarUrl 
      });
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Verificando suas credenciais...</p>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    debugLog("GlobalAdminProfilePage: Erro ou usuário não encontrado, redirecionando para login");
    return <Navigate to="/login" replace />;
  }

  debugLog("GlobalAdminProfilePage: Renderizando página de perfil para:", currentUser);

  const handleAvatarUpdate = async (url: string) => {
    try {
      if (updateProfile && currentUser) {
        debugLog("GlobalAdminProfilePage: Atualizando avatar para:", url);
        await updateProfile({ ...currentUser, avatarUrl: url });
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso."
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: "Não foi possível salvar sua foto de perfil. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Atualize suas informações de administrador global
      </p>

      <div className="max-w-2xl mx-auto">
        {currentUser && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ProfileImageUpload
                userId={currentUser.id}
                currentAvatarUrl={currentUser.avatarUrl}
                onImageUploaded={handleAvatarUpdate}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informações do Perfil</CardTitle>
            <CardDescription>
              Estas informações estarão visíveis para outros usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GlobalAdminProfileForm 
              currentUser={currentUser}
              onSubmit={updateProfile}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GlobalAdminProfilePage;
