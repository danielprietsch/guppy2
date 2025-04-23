
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { User } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Index: Initializing auth management");
    
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
          setIsLoading(false);
        }
      }
    );
    
    // Verificar sessão atual depois
    const checkSession = async () => {
      console.log("Index: Checking current session");
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Index: Found existing session, loading profile");
        await loadUserProfile(session.user.id);
      } else {
        console.log("Index: No active session found");
        setCurrentUser(null);
        setIsLoading(false);
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
          
          // Try to create profile from user metadata
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.user_metadata) {
            console.log("Index: Creating profile from user metadata");
            
            const newProfile = {
              id: userId,
              name: user.user_metadata.name || user.email?.split('@')[0] || "Usuário",
              email: user.email,
              user_type: user.user_metadata.userType || "client",
              avatar_url: user.user_metadata.avatar_url
            };
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert(newProfile);
              
            if (insertError) {
              console.error("Index: Error creating profile:", insertError);
            } else {
              // Profile created, reload
              const { data: createdProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
                
              if (createdProfile) {
                setUserData(createdProfile, user);
              } else {
                setCurrentUser(null);
                setIsLoading(false);
              }
            }
          } else {
            setCurrentUser(null);
            setIsLoading(false);
          }
          return;
        }
        
        if (profile) {
          console.log("Index: Profile loaded successfully:", profile);
          const { data: { user } } = await supabase.auth.getUser();
          setUserData(profile, user);
        } else {
          console.log("Index: No profile found for user:", userId);
          setCurrentUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Index: Error in loadUserProfile:", error);
        setCurrentUser(null);
        setIsLoading(false);
      }
    };
    
    const setUserData = (profile: any, user: any) => {
      const userData: User = {
        id: profile.id,
        name: profile.name || profile.email?.split('@')[0] || "Usuário",
        email: profile.email || user?.email || "",
        userType: profile.user_type as "client" | "provider" | "owner",
        avatarUrl: profile.avatar_url,
        phoneNumber: profile.phone_number
      };
      
      setCurrentUser(userData);
      console.log("Index: User data set:", userData);
      
      // Check if we need to redirect based on user type and current path
      const { pathname } = location;
      
      // Automatic redirection to respective dashboards for authenticated users
      if (pathname === "/login" || pathname === "/register") {
        if (userData.userType === "provider") {
          navigate("/provider/dashboard");
        } else if (userData.userType === "owner") {
          navigate("/owner/dashboard");
        } else {
          navigate("/client/dashboard");
        }
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    return () => {
      console.log("Index: Cleaning up auth listeners");
      subscription.unsubscribe();
    };
  }, [location, navigate]);

  const handleLogout = async () => {
    console.log("Index: Logging out user");
    await supabase.auth.signOut();
    setCurrentUser(null);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema"
    });
    
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1">
        {isLoading && location.pathname.includes('/dashboard') ? (
          <div className="container py-12 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
              <p className="text-muted-foreground">Buscando seus dados, por favor aguarde.</p>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
