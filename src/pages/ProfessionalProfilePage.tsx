import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { debugLog, debugError } from "@/utils/debugLogger";
import { ProfileImageUpload } from "@/components/profile/ProfileImageUpload";

const ProfessionalProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<(User & { specialties?: string[] }) | null>(null);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        debugLog("ProfessionalProfilePage: Verificando sessão...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          debugLog("ProfessionalProfilePage: Sessão não encontrada, redirecionando para login");
          toast({
            title: "Acesso Negado",
            description: "Você precisa estar logado para acessar esta página",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        const userType = session.user.user_metadata?.userType;
        debugLog("ProfessionalProfilePage: Tipo de usuário nos metadados:", userType);
        
        if (userType === 'professional' || userType === 'provider') {
          setProfile({
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: session.user.email || "",
            user_type: 'professional',
            avatarUrl: session.user.user_metadata?.avatar_url,
            specialties: [],
            phoneNumber: session.user.user_metadata?.phone_number,
            cpf: '',
            address: '',
            city: '',
            state: '',
            zip_code: ''
          });
          setIsLoading(false);
          return;
        }
        
        try {
          debugLog("ProfessionalProfilePage: Buscando perfil do usuário");
          const { data: userData, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();
            
          if (error) {
            debugError("ProfessionalProfilePage: Erro ao buscar perfil:", error);
            
            if (userType === 'professional' || userType === 'provider') {
              setProfile({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuário",
                email: session.user.email || "",
                user_type: 'professional',
                avatarUrl: session.user.user_metadata?.avatar_url,
                specialties: [],
                phoneNumber: session.user.user_metadata?.phone_number,
                cpf: '',
                address: '',
                city: '',
                state: '',
                zip_code: ''
              });
              setIsLoading(false);
              return;
            }
            
            toast({
              title: "Erro",
              description: "Erro ao carregar seu perfil",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          if (!userData || (userData.user_type !== "professional" && userData.user_type !== "provider")) {
            debugError("ProfessionalProfilePage: Tipo de usuário inválido ou não encontrado");
            
            if (userType === 'professional' || userType === 'provider') {
              setProfile({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuário",
                email: session.user.email || "",
                user_type: 'professional',
                avatarUrl: session.user.user_metadata?.avatar_url,
                specialties: [],
                phoneNumber: session.user.user_metadata?.phone_number,
                cpf: '',
                address: '',
                city: '',
                state: '',
                zip_code: ''
              });
              setIsLoading(false);
              return;
            }
            
            toast({
              title: "Acesso Negado",
              description: "Você não tem permissão para acessar esta página",
              variant: "destructive",
            });
            navigate("/");
            return;
          }
          
          setProfile({
            id: userData.id,
            name: userData.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuário",
            email: userData.email || session.user.email || "",
            user_type: userData.user_type as "professional",
            avatarUrl: userData.avatar_url || session.user.user_metadata?.avatar_url,
            specialties: [],
            phoneNumber: userData.phone_number,
            cpf: userData.cpf || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zip_code: userData.zip_code || ''
          });
        } catch (error) {
          debugError("ProfessionalProfilePage: Erro ao verificar perfil:", error);
          
          if (userType === 'professional' || userType === 'provider') {
            setProfile({
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Usuário",
              email: session.user.email || "",
              user_type: 'professional',
              avatarUrl: session.user.user_metadata?.avatar_url,
              specialties: [],
              phoneNumber: session.user.user_metadata?.phone_number,
              cpf: '',
              address: '',
              city: '',
              state: '',
              zip_code: ''
            });
            setIsLoading(false);
            return;
          }
          
          toast({
            title: "Erro",
            description: "Erro ao verificar seu perfil",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        debugError("ProfessionalProfilePage: Erro ao verificar sessão:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar sua autenticação",
          variant: "destructive",
        });
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const handleAvatarUpdate = async (url: string) => {
    try {
      debugLog("ProfessionalProfilePage: Updating avatar to:", url);
      
      setProfile(prev => prev ? { ...prev, avatarUrl: url } : null);
      
      await supabase.rpc('update_avatar_everywhere', {
        user_id: profile?.id,
        avatar_url: url
      });
      
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Erro ao atualizar foto",
        description: "Não foi possível atualizar sua foto de perfil.",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram atualizadas com sucesso!",
    });
  };
  
  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">
            Buscando seus dados, por favor aguarde.
          </p>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Erro</h1>
          <p className="text-red-500 mb-4">Não foi possível carregar seu perfil.</p>
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
    );
  }
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Meu Perfil Profissional</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {profile && (
              <ProfileImageUpload
                userId={profile.id}
                currentAvatarUrl={profile.avatarUrl}
                onImageUploaded={handleAvatarUpdate}
                className="mb-4"
              />
            )}
          </CardContent>
        </Card>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome completo"
                    defaultValue={profile?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={profile?.email}
                    readOnly
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Telefone</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="(00) 00000-0000"
                    defaultValue={profile?.phoneNumber || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    defaultValue={profile?.cpf || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, complemento"
                  defaultValue={profile?.address || ""}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Sua cidade"
                    defaultValue={profile?.city || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="UF"
                    defaultValue={profile?.state || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    defaultValue={profile?.zip_code || ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bio">Biografia Profissional</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte sobre sua experiência e especialidades..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Especialidades</Label>
                <div className="flex flex-wrap gap-2">
                  {profile?.specialties && profile.specialties.length > 0 ? (
                    profile.specialties.map((specialty, i) => (
                      <span
                        key={i}
                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma especialidade adicionada</p>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2">
                  Adicionar Especialidade
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => navigate("/professional/dashboard")}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfessionalProfilePage;
