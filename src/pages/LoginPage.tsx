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
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("LoginPage: Checking current session:", session);
        if (session) {
          console.log("LoginPage: Session found, user is authenticated:", session.user);
          navigateBasedOnUserType(session.user);
        } else {
          console.log("LoginPage: No active session found");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    checkCurrentSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("LoginPage: Auth state changed:", event, session);
        
        if (event === "SIGNED_IN") {
          console.log("LoginPage: User signed in successfully");
          setIsLoggingIn(false);
          
          if (session) {
            navigateBasedOnUserType(session.user);
          }
        } else if (event === "SIGNED_OUT") {
          console.log("LoginPage: User signed out");
        }
      }
    );
    
    return () => {
      console.log("LoginPage: Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const navigateBasedOnUserType = async (user: any) => {
    console.log("LoginPage: Navigating based on user type:", user);
    
    try {
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Informações do usuário não encontradas.",
          variant: "destructive"
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        
        if (user.user_metadata) {
          const userType = user.user_metadata.userType || "client";
          const name = user.user_metadata.name || (user.email ? user.email.split('@')[0] : "Usuário");
          
          console.log("LoginPage: Creating profile from metadata:", { name, userType });
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: name,
              email: user.email,
              user_type: userType,
              avatar_url: user.user_metadata.avatar_url
            });
          
          if (insertError) {
            console.error("Error creating user profile:", insertError);
            toast({
              title: "Erro ao criar perfil",
              description: "Não foi possível criar seu perfil. Tente novamente.",
              variant: "destructive"
            });
            return;
          }
          
          redirectBasedOnUserType(userType);
        } else {
          toast({
            title: "Erro ao buscar perfil",
            description: "Não foi possível carregar o perfil do usuário.",
            variant: "destructive"
          });
        }
        return;
      }
      
      const userType = profile?.user_type || "client";
      console.log("LoginPage: Detected user type:", userType);
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${profile?.name || (user.email ? user.email.split('@')[0] : "Usuário")}!`,
      });
      
      redirectBasedOnUserType(userType);
    } catch (error) {
      console.error("Error in navigation logic:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seu login.",
        variant: "destructive"
      });
    }
  };

  const redirectBasedOnUserType = (userType: string) => {
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
      
      console.log("Login successful, waiting for auth state change...", authData);
      
      if (authData?.session) {
        setTimeout(() => {
          navigateBasedOnUserType(authData.session?.user);
        }, 500);
      }
      
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

  const resetTestUserPassword = async () => {
    const testEmail = "teste1@teste.com";
    const newPassword = "123456";
    
    try {
      setIsResettingPassword(true);
      
      console.log("Resetting password for test user:", testEmail);
      
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error listing users:", userError);
        toast({
          title: "Erro",
          description: "Não foi possível verificar se o usuário teste existe.",
          variant: "destructive"
        });
        setIsResettingPassword(false);
        return;
      }
      
      const testUser = users?.find(u => u.email === testEmail);
      
      if (!testUser) {
        console.log("Test user not found, creating one...");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            name: "Usuário Teste",
            userType: "owner",
            avatar_url: `https://ui-avatars.com/api/?name=Usuario+Teste&background=random`
          }
        });
        
        if (signUpError) {
          console.error("Error creating test user:", signUpError);
          toast({
            title: "Erro",
            description: "Não foi possível criar o usuário teste.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Usuário teste criado",
            description: "O usuário teste1@teste.com foi criado com senha 123456.",
          });
        }
      } else {
        console.log("Test user exists, updating password...");
        
        const { error: resetError } = await supabase.auth.admin.updateUserById(
          testUser.id,
          { password: newPassword, email_confirm: true }
        );
        
        if (resetError) {
          console.error("Error updating test user password:", resetError);
          toast({
            title: "Erro",
            description: "Não foi possível redefinir a senha do usuário teste.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Senha redefinida",
            description: "A senha do usuário teste1@teste.com foi redefinida para 123456.",
          });
        }
      }
    } catch (error: any) {
      console.error("Error handling test user:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar redefinir a senha.",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      {authError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <div className="mb-4 flex justify-center">
        <button 
          onClick={resetTestUserPassword}
          className="text-sm text-blue-600 hover:underline"
          disabled={isResettingPassword}
        >
          {isResettingPassword ? "Redefinindo..." : "Redefinir senha do usuário teste"}
        </button>
      </div>
      <AuthForm mode="login" onSubmit={handleLogin} isLoading={isLoggingIn} />
    </div>
  );
};

export default LoginPage;
