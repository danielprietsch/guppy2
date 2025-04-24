
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
          
          // Get user type from metadata first as a fallback
          const userType = session.user.user_metadata?.userType || "client";
          
          // Try to get from profile if possible
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (profile) {
              const dashboardRoute = getDashboardRoute(profile.user_type);
              navigate(dashboardRoute, { replace: true });
              return;
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
          
          // Fallback to metadata
          const dashboardRoute = getDashboardRoute(userType);
          navigate(dashboardRoute, { replace: true });
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
      console.log("Tentando login com:", { email: data.email });
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error("Erro no login:", error);
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
      
      console.log("Login successful:", authData);
      
      if (authData.user) {
        try {
          // First try to get user type from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', authData.user.id)
            .maybeSingle();
            
          if (profile) {
            const dashboardRoute = getDashboardRoute(profile.user_type);
            console.log(`Redirecting to ${dashboardRoute} (from profile)`);
            navigate(dashboardRoute, { replace: true });
          } else {
            // Fallback to metadata
            const userType = authData.user.user_metadata?.userType || "client";
            const dashboardRoute = getDashboardRoute(userType);
            console.log(`Redirecting to ${dashboardRoute} (from metadata)`);
            navigate(dashboardRoute, { replace: true });
          }
        } catch (profileError) {
          console.error("Error fetching profile:", profileError);
          
          // Fallback to metadata if profile fetch fails
          const userType = authData.user.user_metadata?.userType || "client";
          const dashboardRoute = getDashboardRoute(userType);
          console.log(`Redirecting to ${dashboardRoute} (fallback)`);
          navigate(dashboardRoute, { replace: true });
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
