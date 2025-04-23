
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthChangeEvent, Session } from "@supabase/supabase-js";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se já existe uma sessão ativa
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Usuário já está logado, redirecionar
        navigateBasedOnUserType(data.session.user);
      }
    };
    
    checkSession();
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_IN" && session) {
          setIsLoggingIn(false);
          
          // Verificar ou criar perfil de usuário
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
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  const navigateBasedOnUserType = (user: any) => {
    // Verificar o tipo de usuário (do localStorage ou definido como padrão)
    const storedUserData = localStorage.getItem("currentUser");
    let userType = "client"; // Tipo padrão
    
    if (storedUserData) {
      try {
        const parsedUser = JSON.parse(storedUserData);
        userType = parsedUser.userType;
      } catch (error) {
        console.error("Erro ao analisar dados do usuário:", error);
      }
    } else if (user.user_metadata?.userType) {
      userType = user.user_metadata.userType;
    }
    
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
    setIsLoggingIn(true);
    setAuthError(null);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) {
        console.error("Erro no login:", error);
        setAuthError(error.message);
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive"
        });
        setIsLoggingIn(false);
        return Promise.reject(error);
      }
      
      // O redirecionamento será tratado pelo listener onAuthStateChange
      return Promise.resolve();
      
    } catch (error: any) {
      console.error("Erro ao processar login:", error);
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
