
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
  
  useEffect(() => {
    // Reset password for teste1@teste.com if requested
    const resetTestUserPassword = async () => {
      if (isResettingPassword) return;
      
      const testEmail = "teste1@teste.com";
      const newPassword = "123456";
      
      try {
        setIsResettingPassword(true);
        
        // Check if admin rights or special case is needed
        // For demonstration purposes, we're using sign in and update
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: newPassword,
        });
        
        if (signInError) {
          // If can't sign in, try admin update (would require server-side code)
          console.error("Could not sign in test user:", signInError);
          toast({
            title: "Notificação",
            description: "Não foi possível redefinir a senha automaticamente. O usuário precisa usar 'Esqueci minha senha'.",
          });
        } else {
          // User signed in, update password
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
          });
          
          if (updateError) {
            console.error("Could not update password:", updateError);
            toast({
              title: "Erro na redefinição",
              description: "Não foi possível alterar a senha do usuário teste.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Senha redefinida",
              description: "A senha do usuário teste1@teste.com foi redefinida para 123456.",
            });
            
            // Sign out after password reset
            await supabase.auth.signOut();
          }
        }
      } catch (error: any) {
        console.error("Error resetting password:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao tentar redefinir a senha.",
          variant: "destructive"
        });
      } finally {
        setIsResettingPassword(false);
      }
    };
    
    // Commented out to avoid auto-resetting on every page load
    // resetTestUserPassword();
  }, []);
  
  const navigateBasedOnUserType = async (user: any) => {
    console.log("Navigating based on user type:", user);
    
    try {
      // Buscar perfil do usuário
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        toast({
          title: "Erro ao buscar perfil",
          description: "Não foi possível carregar o perfil do usuário.",
          variant: "destructive"
        });
        return;
      }
      
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
      console.error("Error in navigation logic:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar seu login.",
        variant: "destructive"
      });
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
      
      // Success will be handled by auth state change listener
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

  const resetTestUserPassword = async () => {
    const testEmail = "teste1@teste.com";
    const newPassword = "123456";
    
    try {
      setIsResettingPassword(true);
      
      // Using admin auth to update user (this will only work if done properly through server-side)
      const { error } = await supabase.auth.admin.updateUserById(
        // This is a placeholder - real implementation would require server-side code
        'user_id_here',
        { password: newPassword }
      );
      
      if (error) {
        console.error("Admin password reset failed:", error);
        // Fallback to password reset email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          testEmail,
          {
            redirectTo: window.location.origin + '/reset-password',
          }
        );
        
        if (resetError) {
          toast({
            title: "Erro",
            description: "Não foi possível enviar o email de redefinição de senha.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Email enviado",
            description: "Um email de redefinição de senha foi enviado para teste1@teste.com.",
          });
        }
      } else {
        toast({
          title: "Senha redefinida",
          description: "A senha do usuário teste1@teste.com foi redefinida para 123456.",
        });
      }
    } catch (error: any) {
      console.error("Error resetting password:", error);
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
