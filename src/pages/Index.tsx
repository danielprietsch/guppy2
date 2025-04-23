
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { User } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Verificar se há usuário autenticado no Supabase
    const checkAuthStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setCurrentUser(null);
        return;
      }
      
      // Se houver usuário autenticado, buscar perfil
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          const userData: User = {
            id: user.id,
            name: profile.name || user.email?.split('@')[0] || "Usuário",
            email: profile.email || user.email || "",
            userType: profile.user_type as "client" | "provider" | "owner",
            avatarUrl: profile.avatar_url,
            phoneNumber: profile.phone_number
          };
          
          console.log("Index: User profile loaded:", userData);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        setCurrentUser(null);
      }
    };
    
    checkAuthStatus();
    
    // Monitorar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Index: Auth state changed:", event);
        if (event === "SIGNED_IN" && session?.user) {
          await checkAuthStatus();
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
