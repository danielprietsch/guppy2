
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { OwnerProfileForm } from "@/components/owner/OwnerProfileForm";

const OwnerProfilePage = () => {
  const { currentUser, isLoading, setCurrentUser } = useOwnerProfile();

  if (isLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
      <p className="text-muted-foreground mb-8">
        Atualize suas informações de franqueado
      </p>

      <div className="max-w-2xl mx-auto">
        <OwnerProfileForm 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser} 
        />
      </div>
    </div>
  );
};

export default OwnerProfilePage;
