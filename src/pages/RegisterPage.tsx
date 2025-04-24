
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSupabaseError } from "@/utils/supabaseErrorTranslations";
import { handleGlobalAdminRegistration, isGlobalAdminEmail } from "@/utils/globalAdminUtils";
import { debugLog, debugError } from "@/utils/debugLogger";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        debugLog("RegisterPage: Checking for existing session...");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          debugLog("RegisterPage: Found existing session:", session.user.id);
          
          // Usar metadados como fonte principal - mais confiável
          const userType = session.user.user_metadata?.userType;
          debugLog("RegisterPage: User type from metadata:", userType);
          
          if (userType) {
            const dashboardRoute = getDashboardRoute(userType);
            debugLog(`RegisterPage: Redirecting to ${dashboardRoute} (from metadata)`);
            navigate(dashboardRoute, { replace: true });
            return;
          }
          
          // Tentar o perfil como fonte secundária
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (error) {
              debugError("RegisterPage: Error fetching profile:", error);
              // Se não conseguimos determinar, assumir cliente
              navigate("/client/dashboard", { replace: true });
              return;
            }
            
            if (profile) {
              debugLog("RegisterPage: User type from profile:", profile.user_type);
              const dashboardRoute = getDashboardRoute(profile.user_type);
              debugLog(`RegisterPage: Redirecting to ${dashboardRoute} (from profile)`);
              navigate(dashboardRoute, { replace: true });
              return;
            }
          } catch (error) {
            debugError("RegisterPage: Error fetching profile:", error);
            // Por padrão redirecionar para dashboard do cliente
            navigate("/client/dashboard", { replace: true });
            return;
          }
          
          // Se chegou aqui, não conseguimos determinar o tipo de usuário
          // Por padrão redirecionar para dashboard do cliente
          debugLog("RegisterPage: Unable to determine user type, defaulting to client");
          navigate("/client/dashboard", { replace: true });
        } else {
          debugLog("RegisterPage: No active session");
        }
      } catch (error) {
        debugError("RegisterPage: Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkSession();
  }, [navigate]);

  const getDashboardRoute = (userType: string): string => {
    debugLog("RegisterPage: Getting dashboard route for user type:", userType);
    switch (userType.toLowerCase()) {
      case "provider":
      case "professional":
        return "/professional/dashboard";
      case "owner":
        return "/owner/dashboard";
      case "global_admin":
        return "/admin/global";
      default:
        return "/client/dashboard";
    }
  };

  const handleRegister = async (data: {
    name: string;
    email: string;
    password: string;
    userType: "client" | "provider" | "owner" | "global_admin";
  }) => {
    debugLog("Iniciando processo de registro...");
    setIsRegistering(true);
    setAuthError(null);
    
    try {
      const userTypeValue = data.userType.toLowerCase();
      debugLog("Tentando registrar com:", { 
        email: data.email, 
        userType: userTypeValue 
      });

      // Tratamento especial para administrador global
      if (userTypeValue === "global_admin") {
        debugLog("Registrando como administrador global");
        const success = await handleGlobalAdminRegistration({
          email: data.email,
          password: data.password,
          name: data.name
        });
        
        if (success) {
          toast({
            title: "Administrador global registrado com sucesso",
            description: "Redirecionando para o dashboard de administrador global"
          });
          
          // Aguardar um momento para o perfil ser criado antes de redirecionar
          setTimeout(() => {
            navigate("/admin/global", { replace: true });
          }, 1000);
          
          setIsRegistering(false);
          return Promise.resolve();
        } else {
          setAuthError("Erro ao registrar administrador global");
          setIsRegistering(false);
          return Promise.reject(new Error("Erro ao registrar administrador global"));
        }
      }
      
      // Mapear "provider" para "professional" para consistência no banco de dados
      const mappedUserType = userTypeValue === "provider" ? "professional" : userTypeValue;
      
      // Tratamento para outros tipos de usuário
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            userType: mappedUserType, // Usar o tipo já mapeado aqui
            avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`
          }
        }
      });
      
      if (error) {
        console.error("Erro no registro:", error);
        const translatedError = translateSupabaseError(error.message);
        setAuthError(translatedError);
        toast({
          title: "Erro no cadastro",
          description: translatedError,
          variant: "destructive"
        });
        setIsRegistering(false);
        return Promise.reject(error);
      }
      
      debugLog("Registration successful:", authData);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada com sucesso.",
      });
      
      if (authData.user) {
        // Usar o tipo mapeado para determinar o dashboard
        const dashboardRoute = getDashboardRoute(mappedUserType);
        
        debugLog(`Redirecting to ${dashboardRoute}`);
        
        // Pequeno atraso para permitir que a sessão seja totalmente estabelecida
        setTimeout(() => {
          navigate(dashboardRoute, { replace: true });
        }, 500);
      }
      
      setIsRegistering(false);
      return Promise.resolve();
      
    } catch (error: any) {
      console.error("Erro ao processar registro:", error);
      const translatedError = translateSupabaseError(error.message);
      setAuthError(translatedError);
      toast({
        title: "Erro no cadastro",
        description: translatedError,
        variant: "destructive"
      });
      
      setIsRegistering(false);
      return Promise.reject(error);
    }
  };
  
  if (isCheckingSession) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Verificando sessão...</h1>
          <p className="text-muted-foreground">Por favor, aguarde.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <AuthForm mode="register" onSubmit={handleRegister} isLoading={isRegistering} />
    </div>
  );
};

export default RegisterPage;
