
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthChangeEvent } from "@supabase/supabase-js";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se já existe uma sessão ativa
    const checkSession = async () => {
      console.log("Checking for existing session...");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("Found existing session:", data.session);
        // Usuário já está logado, redirecionar
        navigateBasedOnUserType(data.session.user);
      }
    };
    
    checkSession();
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session) => {
        console.log("Auth state changed:", event, session);
        
        // Compare as strings to fix the type error
        if (event.toString() === "SIGNED_UP") {
          console.log("User signed up successfully");
          setIsRegistering(false);
          
          // Exibir toast de sucesso
          toast({
            title: "Cadastro realizado com sucesso!",
            description: "Sua conta foi criada com sucesso.",
          });
          
          // O redirecionamento será tratado no evento SIGNED_IN que vem em seguida
        }

        // Add debug for SIGNED_IN event
        if (event.toString() === "SIGNED_IN") {
          console.log("User signed in after registration");
          if (session?.user) {
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

  const handleRegister = async (data: {
    name: string;
    email: string;
    password: string;
    userType: "client" | "provider" | "owner";
  }) => {
    console.log("Starting registration process...");
    setIsRegistering(true);
    setAuthError(null);
    
    try {
      console.log("Attempting to register with:", { 
        email: data.email, 
        userType: data.userType 
      });
      
      // Cadastrar usuário no Supabase
      const { error } = await supabase.auth.signUp({
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
        console.error("Registration error:", error);
        setAuthError(error.message);
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
        setIsRegistering(false);
        return Promise.reject(error);
      }
      
      console.log("Registration successful, waiting for auth state change...");
      return Promise.resolve();
      
    } catch (error: any) {
      console.error("Error processing registration:", error);
      setAuthError(error.message);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um problema ao processar o cadastro.",
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
