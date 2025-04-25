import { useClientProfile } from "@/hooks/useClientProfile";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";
import { debugAreaLog, debugAreaCritical } from "@/utils/debugLogger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const ClientProfilePage = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, error, updateProfile } = useClientProfile();
  
  debugAreaLog("CLIENT_PROFILE", "ClientProfilePage rendered", { 
    isLoading, 
    hasUser: !!currentUser,
    error
  });

  const handleUpdateProfile = async (data: any) => {
    debugAreaLog("CLIENT_PROFILE", "Handling profile update with data:", data);
    
    try {
      const result = await updateProfile({
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });
      
      if (!result?.success) {
        debugAreaCritical("CLIENT_PROFILE", "Error updating profile:", result?.error);
        throw new Error(result?.error || "Erro desconhecido ao atualizar perfil");
      }
      
      debugAreaLog("CLIENT_PROFILE", "Profile update successful");
    } catch (error: any) {
      debugAreaCritical("CLIENT_PROFILE", "Error in handleUpdateProfile:", error);
      throw new Error(error.message || "Ocorreu um erro ao atualizar o perfil");
    }
  };

  const handleAvatarUpdate = async (url: string) => {
    try {
      debugAreaLog("CLIENT_PROFILE", "Updating avatar to:", url);
      
      if (updateProfile && currentUser) {
        await updateProfile({ 
          avatarUrl: url 
        });
        
        debugAreaLog("CLIENT_PROFILE", "Avatar updated successfully to:", url);
        
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso."
        });
      }
    } catch (error: any) {
      debugAreaCritical("CLIENT_PROFILE", "Error updating avatar:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: error.message || "Ocorreu um erro ao atualizar sua foto de perfil.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
            <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
    debugAreaCritical("CLIENT_PROFILE", "Error or no user found:", { error, currentUser });
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Erro</h1>
            <p className="text-red-500 mb-4">{error || "Não foi possível carregar seu perfil."}</p>
            <div className="space-x-4">
              <Button 
                onClick={() => navigate("/")}
                variant="outline"
              >
                Voltar para a página inicial
              </Button>
              <Button 
                onClick={() => navigate("/login")}
              >
                Ir para o login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Atualize suas informações pessoais
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
        
        <div className="bg-card p-6 rounded-lg shadow">
          <ClientProfileForm 
            currentUser={currentUser} 
            onSave={handleUpdateProfile} 
            isLoading={isLoading} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
