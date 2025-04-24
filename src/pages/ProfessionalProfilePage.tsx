
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

const ProfessionalProfilePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<(User & { specialties?: string[] }) | null>(null);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Acesso Negado",
            description: "Você precisa estar logado para acessar esta página",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
        
        // Check if user is professional
        const { data: userData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
          
        if (error || userData?.user_type !== "professional") {
          toast({
            title: "Acesso Negado",
            description: "Você não tem permissão para acessar esta página",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        // Create a properly typed User object from userData
        setProfile({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          userType: userData.user_type as "professional",
          avatarUrl: userData.avatar_url,
          phoneNumber: userData.phone_number,
          // Initialize specialties as empty array if not available
          specialties: [],
        });
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle saving professional profile
    toast({
      title: "Perfil Atualizado",
      description: "Suas informações foram atualizadas com sucesso!",
    });
  };
  
  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">
            Buscando seus dados, por favor aguarde.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Meu Perfil Profissional</h1>
        
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
