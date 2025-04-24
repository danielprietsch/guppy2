import { Navigate } from "react-router-dom";
import { useGlobalAdminProfile } from "@/hooks/useGlobalAdminProfile";
import { GlobalAdminProfileForm } from "@/components/admin/GlobalAdminProfileForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";
import { debugLog } from "@/utils/debugLogger";

const GlobalAdminProfilePage = () => {
  const { currentUser, isLoading, error, updateProfile } = useGlobalAdminProfile();

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

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Atualize suas informações de administrador global
      </p>

      <div className="max-w-2xl mx-auto">
        {currentUser && (
          <div className="mb-8">
            <ProfileImageUpload
              userId={currentUser.id}
              currentAvatarUrl={currentUser.avatarUrl}
              onImageUploaded={(url) => {
                if (updateProfile) {
                  updateProfile({ ...currentUser, avatarUrl: url });
                }
              }}
            />
          </div>
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
