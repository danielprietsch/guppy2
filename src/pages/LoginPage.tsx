
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

  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        debugLog("LoginPage: Checking current session:", session);
        if (session) {
          debugLog("LoginPage: Session found, user is authenticated:", session.user);
          
          // Get user type from metadata first as a fallback
          const userTypeFromMetadata = session.user.user_metadata?.userType || "client";
          
          // Try to get from profile if possible
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (profile) {
              debugLog("LoginPage: Found profile with user_type:", profile.user_type);
              const dashboardRoute = getDashboardRoute(profile.user_type);
              debugLog("LoginPage: Redirecting to dashboard route:", dashboardRoute);
              navigate(dashboardRoute, { replace: true });
              return;
            }
          } catch (error) {
            debugError("Error fetching profile:", error);
          }
          
          // Fallback to metadata if profile not found or error occurs
          debugLog("LoginPage: Using metadata user type:", userTypeFromMetadata);
          const dashboardRoute = getDashboardRoute(userTypeFromMetadata);
          debugLog("LoginPage: Redirecting to dashboard route (fallback):", dashboardRoute);
          navigate(dashboardRoute, { replace: true });
        } else {
          debugLog("LoginPage: No active session found");
        }
      } catch (error) {
        debugError("Error checking session:", error);
      }
    };
    
    checkCurrentSession();
  }, [navigate]);

  const getDashboardRoute = (userType: string): string => {
    debugLog("LoginPage: Getting dashboard route for user type:", userType);
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
      
      debugLog("Login successful:", authData);
      
      if (authData.user) {
        try {
          // Check if this is a global admin by metadata
          const userTypeFromMetadata = authData.user.user_metadata?.userType;
          if (userTypeFromMetadata === 'global_admin') {
            debugLog("Login: User is global_admin according to metadata");
            navigate("/admin/global", { replace: true });
            setIsLoggingIn(false);
            return Promise.resolve();
          }
          
          // First try to get user type from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', authData.user.id)
            .maybeSingle();
            
          if (profile) {
            debugLog("Login: Found profile with user_type:", profile.user_type);
            
            // Special check for global_admin
            if (profile.user_type === 'global_admin') {
              debugLog("Login: User is global_admin according to profile");
              navigate("/admin/global", { replace: true });
            } else {
              const dashboardRoute = getDashboardRoute(profile.user_type);
              debugLog(`Redirecting to ${dashboardRoute} (from profile)`);
              navigate(dashboardRoute, { replace: true });
            }
          } else {
            // Fallback to metadata
            const userType = userTypeFromMetadata || "client";
            debugLog("Login: No profile found, using metadata user_type:", userType);
            const dashboardRoute = getDashboardRoute(userType);
            debugLog(`Redirecting to ${dashboardRoute} (from metadata)`);
            navigate(dashboardRoute, { replace: true });
          }
        } catch (profileError) {
          debugError("Error fetching profile:", profileError);
          
          // Fallback to metadata if profile fetch fails
          const userType = authData.user.user_metadata?.userType || "client";
          debugLog("Login: Error fetching profile, using metadata user_type:", userType);
          const dashboardRoute = getDashboardRoute(userType);
          debugLog(`Redirecting to ${dashboardRoute} (fallback)`);
          navigate(dashboardRoute, { replace: true });
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
