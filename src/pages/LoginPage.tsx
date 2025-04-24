import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSupabaseError } from "@/utils/supabaseErrorTranslations";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("LoginPage: Checking current session:", session);
        if (session) {
          console.log("LoginPage: Session found, user is authenticated:", session.user);
          // If user is already logged in, redirect to appropriate dashboard
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
      // Adiciona uma verificação extra para o usuário admin
      if (data.email === 'guppyadmin@nuvemtecnologia.com') {
        // Você pode adicionar validações adicionais aqui, como:
        // - Verificar se o IP de login está em uma lista de IPs permitidos
        // - Adicionar autenticação de dois fatores
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
      
      // Get user profile to determine dashboard type
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
            
            // Immediate redirect to dashboard
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

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoggingIn} />
    </div>
  );
};

export default LoginPage;
