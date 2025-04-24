import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSupabaseError } from "@/utils/supabaseErrorTranslations";
import { Button } from "@/components/ui/button";
import { 
  sendPasswordResetToGlobalAdmin, 
  recreateGlobalAdmin 
} from "@/utils/globalAdminUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [isAdminActionLoading, setIsAdminActionLoading] = useState(false);

  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("LoginPage: Checking current session:", session);
        if (session) {
          console.log("LoginPage: Session found, user is authenticated:", session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            const dashboardRoute = getDashboardRoute(profile.user_type);
            navigate(dashboardRoute, { replace: true });
          }
        } else {
          console.log("LoginPage: No active session found");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkCurrentSession();
  }, [navigate]);

  const getDashboardRoute = (userType: string): string => {
    switch (userType) {
      case "global_admin":
        return "/admin/global";
      case "provider":
        return "/provider/dashboard";
      case "owner":
        return "/owner/dashboard";
      default:
        return "/client/dashboard";
    }
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    console.log("Iniciando processo de login...");
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      if (data.email === 'guppyadmin@nuvemtecnologia.com') {
        console.log("Login de usuário admin detectado");
      }
      
      console.log("Tentando login com email:", data.email);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error("Erro de login:", error);
        const translatedError = translateSupabaseError(error.message);
        setAuthError(translatedError);
        toast({
          title: "Erro no login",
          description: translatedError,
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return Promise.reject(error);
      }
      
      console.log("Login successful, getting user profile...", authData);
      
      if (authData.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', authData.user.id)
            .single();
            
          if (profile) {
            const dashboardRoute = getDashboardRoute(profile.user_type);
            console.log(`Redirecting to ${dashboardRoute}`);
            toast({
              title: "Login realizado com sucesso",
              description: "Bem-vindo de volta!"
            });
            
            navigate(dashboardRoute, { replace: true });
          } else {
            console.error("No profile found for user");
            toast({
              title: "Erro no login",
              description: "Perfil de usuário não encontrado.",
              variant: "destructive"
            });
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
        }
      }
      
      setIsLoggingIn(false);
      return Promise.resolve();
      
    } catch (error: any) {
      console.error("Erro ao processar login:", error);
      const translatedError = translateSupabaseError(error.message);
      setAuthError(translatedError);
      toast({
        title: "Erro no login",
        description: translatedError,
        variant: "destructive"
      });
      
      setIsLoggingIn(false);
      return Promise.reject(error);
    }
  };

  const handleGlobalAdminReset = async () => {
    setIsAdminActionLoading(true);
    await sendPasswordResetToGlobalAdmin();
    setIsAdminActionLoading(false);
  };

  const handleGlobalAdminRecreate = async () => {
    setIsAdminActionLoading(true);
    await recreateGlobalAdmin();
    setIsAdminActionLoading(false);
  };

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoggingIn} />
      
      <div className="mt-8 border-t pt-6">
        <h3 className="text-md font-medium mb-2">Área do Administrador</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Se você é o administrador global e está com dificuldades para acessar o sistema:
        </p>
        
        <Dialog open={isAdminResetOpen} onOpenChange={setIsAdminResetOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              Opções de Administrador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opções de Administrador Global</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Escolha uma das opções abaixo para resolver problemas de acesso ao administrador global.
              </p>
              <Button 
                variant="outline" 
                onClick={handleGlobalAdminReset}
                disabled={isAdminActionLoading}
              >
                Enviar e-mail de redefinição de senha
              </Button>
              <Button 
                variant="outline"
                onClick={handleGlobalAdminRecreate}
                disabled={isAdminActionLoading}
              >
                Recriar usuário administrador
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LoginPage;
