
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se já há sessão ativa
    const checkCurrentSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Existing session found:", session);
        navigateBasedOnUserType(session.user);
      }
    };
    
    checkCurrentSession();
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session);
        
        if (event === "SIGNED_IN") {
          console.log("User signed in successfully");
          setIsLoggingIn(false);
          
          // Verificar ou criar perfil de usuário
          if (session) {
            navigateBasedOnUserType(session.user);
          }
        }
      }
    );
    
    return () => {
      console.log("Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  const navigateBasedOnUserType = async (user: any) => {
    console.log("Navigating based on user type:", user);
    
    try {
      // Buscar perfil do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Verificar o tipo de usuário
      const userType = profile?.user_type || user.user_metadata?.userType || "client";
      console.log("Detected user type:", userType);
      
      // Mostrar toast de sucesso
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || "Usuário"}!`,
      });
      
      // Redirecionar com base no tipo
      if (userType === "provider") {
        navigate("/provider/dashboard");
      } else if (userType === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/client/dashboard");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      // Fallback para metadata
      const userType = user.user_metadata?.userType || "client";
      
      // Redirecionar com base no tipo
      if (userType === "provider") {
        navigate("/provider/dashboard");
      } else if (userType === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/client/dashboard");
      }
    }
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    console.log("Starting login process...");
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      console.log("Attempting to login with email:", data.email);
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error("Login error:", error);
        setAuthError(error.message);
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return Promise.reject(error);
      }
      
      console.log("Login successful, waiting for auth state change...");
      return Promise.resolve();
      
    } catch (error: any) {
      console.error("Error processing login:", error);
      setAuthError(error.message);
      toast({
        title: "Erro no login",
        description: "Ocorreu um problema ao processar o login.",
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
