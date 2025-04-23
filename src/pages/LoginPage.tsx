
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthChangeEvent } from "@supabase/supabase-js";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Limpar qualquer sessão anterior para evitar login automático
    localStorage.removeItem("currentUser");
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        console.log("Auth state changed:", event, session);
        
        // Compare as strings to fix the type error
        if (event.toString() === "SIGNED_IN") {
          console.log("User signed in successfully");
          setIsLoggingIn(false);
          
          // Verificar ou criar perfil de usuário
          if (session) {
            const userEmail = session.user.email;
            const userName = session.user.user_metadata?.name || userEmail?.split('@')[0] || "Usuário";
            
            // Salvar informações no localStorage para compatibilidade com a aplicação
            const userType = session.user.user_metadata?.userType || "client";
            
            const userData = {
              id: session.user.id,
              name: userName,
              email: userEmail,
              userType: userType,
              avatarUrl: session.user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`,
            };
            
            console.log("Saving user data to localStorage:", userData);
            localStorage.setItem("currentUser", JSON.stringify(userData));
            
            // Mostrar toast de sucesso
            toast({
              title: "Login realizado com sucesso",
              description: `Bem-vindo, ${userName}!`,
            });
            
            // Redirecionar baseado no tipo de usuário
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
  
  const navigateBasedOnUserType = (user: any) => {
    console.log("Navigating based on user type:", user);
    // Verificar o tipo de usuário (do metadata ou padrão)
    const userType = user.user_metadata?.userType || "client";
    console.log("Detected user type:", userType);
    
    // Redirecionar com base no tipo
    if (userType === "provider") {
      navigate("/provider/dashboard");
    } else if (userType === "owner") {
      navigate("/owner/dashboard");
    } else {
      navigate("/client/dashboard");
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
