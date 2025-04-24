
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSupabaseError } from "@/utils/supabaseErrorTranslations";
import { debugLog, debugError } from "@/utils/debugLogger";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        debugLog("LoginPage: Checking current session:", session?.user?.id);
        
        if (session) {
          debugLog("LoginPage: Session found, user is authenticated");
          
          // Obter tipo de usuário dos metadados como fonte principal
          const userTypeFromMetadata = session.user.user_metadata?.userType;
          debugLog("LoginPage: User type from metadata:", userTypeFromMetadata);
          
          if (userTypeFromMetadata) {
            const dashboardRoute = getDashboardRoute(userTypeFromMetadata);
            debugLog(`LoginPage: Redirecting to ${dashboardRoute} (from metadata)`);
            navigate(dashboardRoute, { replace: true });
            return;
          }
          
          // Tentar obter do perfil como fonte secundária
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (error) {
              debugError("LoginPage: Error fetching profile:", error);
              // Por padrão, ir para cliente se não conseguir determinar
              navigate("/client/dashboard", { replace: true });
              return;
            }
              
            if (profile) {
              debugLog("LoginPage: Found profile with user_type:", profile.user_type);
              const dashboardRoute = getDashboardRoute(profile.user_type);
              debugLog("LoginPage: Redirecting to dashboard route:", dashboardRoute);
              navigate(dashboardRoute, { replace: true });
              return;
            } else {
              // Nenhum perfil encontrado, usar cliente como padrão
              debugLog("LoginPage: No profile found, defaulting to client");
              navigate("/client/dashboard", { replace: true });
            }
          } catch (error) {
            debugError("Error fetching profile:", error);
            // Por padrão, ir para cliente se não conseguir determinar
            navigate("/client/dashboard", { replace: true });
          }
        } else {
          debugLog("LoginPage: No active session found");
        }
      } catch (error) {
        debugError("Error checking session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    checkCurrentSession();
  }, [navigate]);

  const getDashboardRoute = (userType: string): string => {
    debugLog("LoginPage: Getting dashboard route for user type:", userType);
    // Garantir que a comparação seja case-insensitive
    const userTypeLower = userType.toLowerCase();
    if (userTypeLower === "provider" || userTypeLower === "professional") {
      return "/professional/dashboard";
    } else if (userTypeLower === "global_admin") {
      return "/admin/global";
    } else if (userTypeLower === "owner") {
      return "/owner/dashboard";
    } else {
      return "/client/dashboard";
    }
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    debugLog("Iniciando processo de login...");
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      debugLog("Tentando login com:", { email: data.email });
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        debugError("Erro no login:", error);
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
      
      debugLog("Login successful:", authData?.user?.id);
      
      if (authData.user) {
        // Obter tipo de usuário diretamente dos metadados - mais confiável
        const userTypeFromMetadata = authData.user.user_metadata?.userType;
        if (userTypeFromMetadata) {
          debugLog("Login: Using metadata user_type:", userTypeFromMetadata);
          const dashboardRoute = getDashboardRoute(userTypeFromMetadata);
          debugLog(`Redirecting to ${dashboardRoute} (from metadata)`);
          
          // Pequeno atraso para permitir que a sessão seja totalmente estabelecida
          setTimeout(() => {
            navigate(dashboardRoute, { replace: true });
          }, 500);
          
          setIsLoggingIn(false);
          return Promise.resolve();
        }
            
        try {
          // Só tentar obter perfil se os metadados não tiverem o tipo de usuário
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', authData.user.id)
            .maybeSingle();
            
          if (error) {
            debugError("Login: Error fetching profile:", error);
            // Por padrão, ir para cliente
            setTimeout(() => {
              navigate("/client/dashboard", { replace: true });
            }, 500);
          } else if (profile) {
            debugLog("Login: Found profile with user_type:", profile.user_type);
            const dashboardRoute = getDashboardRoute(profile.user_type);
            debugLog(`Redirecting to ${dashboardRoute} (from profile)`);
            setTimeout(() => {
              navigate(dashboardRoute, { replace: true });
            }, 500);
          } else {
            // Nenhum perfil encontrado, usar cliente como padrão
            debugLog("Login: No profile found, defaulting to client dashboard");
            setTimeout(() => {
              navigate("/client/dashboard", { replace: true });
            }, 500);
          }
        } catch (profileError) {
          debugError("Error fetching profile:", profileError);
          // Por padrão, ir para cliente
          setTimeout(() => {
            navigate("/client/dashboard", { replace: true });
          }, 500);
        }
      }
      
      setIsLoggingIn(false);
      return Promise.resolve();
      
    } catch (error: any) {
      debugError("Erro ao processar login:", error);
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
      <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoggingIn} />
    </div>
  );
};

export default LoginPage;
