
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
    // Verificar sessão atual
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            const userData: User = {
              id: session.user.id,
              name: profile.name || session.user.email?.split('@')[0] || "Usuário",
              email: profile.email || session.user.email || "",
              userType: profile.user_type as "client" | "provider" | "owner",
              avatarUrl: profile.avatar_url,
              phoneNumber: profile.phone_number
            };
            
            setCurrentUser(userData);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setCurrentUser(null);
        }
      }
    };
    
    checkSession();
    
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Index: Auth state changed:", event);
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile) {
              const userData: User = {
                id: session.user.id,
                name: profile.name || session.user.email?.split('@')[0] || "Usuário",
                email: profile.email || session.user.email || "",
                userType: profile.user_type as "client" | "provider" | "owner",
                avatarUrl: profile.avatar_url,
                phoneNumber: profile.phone_number
              };
              
              setCurrentUser(userData);
            }
          } catch (error) {
            console.error("Error loading user profile:", error);
            setCurrentUser(null);
          }
        } else {
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
