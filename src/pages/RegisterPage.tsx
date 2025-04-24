import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/AuthForm";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateSupabaseError } from "@/utils/supabaseErrorTranslations";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      console.log("RegisterPage: Checking for existing session...");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("RegisterPage: Found existing session:", data.session);
        // If user is already logged in, redirect to appropriate dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.session.user.id)
          .single();
          
        if (profile) {
          const dashboardRoute = getDashboardRoute(profile.user_type);
          navigate(dashboardRoute, { replace: true });
        }
      }
    };
    
    checkSession();
  }, [navigate]);

  // Helper function to determine dashboard route based on user type
  const getDashboardRoute = (userType: string): string => {
    switch (userType) {
      case "provider":
        return "/provider/dashboard";
      case "owner":
        return "/owner/dashboard";
      default:
        return "/client/dashboard";
    }
  };

  const handleRegister = async (data: {
    name: string;
    email: string;
    password: string;
    userType: "client" | "provider" | "owner";
  }) => {
    console.log("Iniciando processo de registro...");
    setIsRegistering(true);
    setAuthError(null);
    
    try {
      console.log("Tentando registrar com:", { 
        email: data.email, 
        userType: data.userType 
      });
      
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            userType: data.userType,
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
      
      console.log("Registration successful:", authData);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada com sucesso.",
      });
      
      // Check for profile or wait for trigger to create it
      if (authData.user) {
        // Try to find profile (it may take a moment for the trigger to create it)
        let retries = 0;
        let profile = null;
        
        while (retries < 3 && !profile) {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', authData.user.id)
              .maybeSingle();
              
            if (profileData) {
              profile = profileData;
              break;
            }
          } catch (err) {
            console.log("Profile not ready yet, retrying...");
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }
        
        // Use specified userType if profile not found
        const userType = profile?.user_type || data.userType;
        const dashboardRoute = getDashboardRoute(userType);
        
        // Redirect to appropriate dashboard
        console.log(`Redirecting to ${dashboardRoute}`);
        navigate(dashboardRoute, { replace: true });
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
