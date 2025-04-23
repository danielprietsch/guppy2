
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
    console.log("Index: Initializing auth management");
    let profileSubscription: any = null;
    
    // Configurar listener para mudanças de autenticação primeiro
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Index: Auth state changed:", event);
        
        if (session?.user) {
          console.log("Index: User is authenticated, loading profile");
          await loadUserProfile(session.user.id);
        } else {
          console.log("Index: No user session, clearing current user");
          setCurrentUser(null);
        }
      }
    );
    
    // Verificar sessão atual depois
    const checkSession = async () => {
      console.log("Index: Checking current session");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Index: Found existing session, loading profile");
        await loadUserProfile(session.user.id);
      } else {
        console.log("Index: No active session found");
      }
    };
    
    const loadUserProfile = async (userId: string) => {
      try {
        console.log("Index: Loading profile for user:", userId);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error("Index: Error loading profile:", error);
          setCurrentUser(null);
          return;
        }
        
        if (profile) {
          console.log("Index: Profile loaded successfully:", profile);
          const userData: User = {
            id: userId,
            name: profile.name || profile.email?.split('@')[0] || "Usuário",
            email: profile.email || "",
            userType: profile.user_type as "client" | "provider" | "owner",
            avatarUrl: profile.avatar_url,
            phoneNumber: profile.phone_number
          };
          
          setCurrentUser(userData);
        } else {
          console.log("Index: No profile found for user:", userId);
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Index: Error in loadUserProfile:", error);
        setCurrentUser(null);
      }
    };
    
    checkSession();
    
    return () => {
      console.log("Index: Cleaning up auth listeners");
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, []);

  const handleLogout = async () => {
    console.log("Index: Logging out user");
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
