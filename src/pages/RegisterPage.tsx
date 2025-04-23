
import AuthForm from "@/components/AuthForm";
import { useNavigate } from "react-router-dom";
import { users } from "@/lib/mock-data";
import { User } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = (data: {
    name: string;
    email: string;
    password: string;
    userType: "client" | "provider" | "owner";
  }) => {
    setIsRegistering(true);

    // Check if email already exists
    const emailExists = users.some((user) => user.email === data.email);

    if (emailExists) {
      toast({
        title: "Erro no cadastro",
        description: "Este email já está em uso.",
        variant: "destructive",
      });
      setIsRegistering(false);
      return Promise.reject(new Error("Email already in use"));
    }

    // In a real application, this would make an API call to register the user
    // For this mock version, we'll just simulate a successful registration
    
    // Create a new user object
    const newUser: User = {
      id: `${users.length + 1}`, // Simple ID generation
      name: data.name,
      email: data.email,
      userType: data.userType,
      // Add default avatar based on name initials
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
      // Add default specialties if provider
      ...(data.userType === "provider" && { specialties: [] }),
      // Add empty owned locations array if owner
      ...(data.userType === "owner" && { ownedLocationIds: [] }),
    };
    
    console.log("Saving user to localStorage:", newUser);
    
    // Store user in localStorage (in a real app, you'd use a proper auth system)
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    
    // Redirect based on user type and inform navigation bar of user change
    if (data.userType === "provider") {
      navigate("/provider/dashboard");
    } else if (data.userType === "owner") {
      navigate("/owner/dashboard");
    } else {
      navigate("/client/dashboard");
    }
      
    // Add small delay to ensure navigation completes before showing toast
    setTimeout(() => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua conta foi criada com sucesso.",
      });
        
      setIsRegistering(false);
    }, 100);
    
    return Promise.resolve();
  };
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <AuthForm mode="register" onSubmit={handleRegister} />
    </div>
  );
};

export default RegisterPage;
