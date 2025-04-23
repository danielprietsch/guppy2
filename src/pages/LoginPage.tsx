
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { users } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = (data: { email: string; password: string }) => {
    // In a real application, this would make an API call to authenticate
    // For this mock version, we're just checking if the email exists in our mock data
    
    const foundUser = users.find(user => user.email === data.email);
    
    if (foundUser) {
      // In a real app, we'd verify the password here
      // For demo purposes, we'll just simulate a successful login
      
      // Store user info in localStorage (in a real app, you'd use a proper auth system)
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      
      // Show success toast
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${foundUser.name}!`,
      });
      
      // Redirect based on user type
      setTimeout(() => {
        if (foundUser.userType === "provider") {
          navigate("/provider/dashboard");
        } else if (foundUser.userType === "owner") {
          navigate("/owner/dashboard");
        } else {
          navigate("/client/dashboard");
        }
      }, 100); // Small timeout to ensure toast appears and navigation happens smoothly
      
      return Promise.resolve();
    } else {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos.",
        variant: "destructive"
      });
      
      return Promise.reject(new Error("Invalid credentials"));
    }
  };
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <AuthForm mode="login" onSubmit={handleLogin} />
    </div>
  );
};

export default LoginPage;
