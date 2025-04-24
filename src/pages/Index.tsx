
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
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Index: Initializing auth management");
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Index: Auth state changed:", event);
        
        // For syncing auth state without redirects
        if (session?.user) {
          // Use setTimeout to avoid race conditions
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setCurrentUser(null);
          setUserRoles([]);
          setIsLoading(false);
          
          // Only redirect to login if on a protected page
          const currentPath = location.pathname;
          if (currentPath.includes('/dashboard') || 
              currentPath.includes('/profile') ||
              currentPath.includes('/admin')) {
            navigate('/login', { replace: true });
          }
        }
      }
    );
    
    // Check for existing session
    const checkSession = async () => {
      console.log("Index: Checking current session");
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log("Index: Found existing session, loading profile");
        loadUserProfile(session.user.id);
      } else {
        console.log("Index: No active session found");
        setIsLoading(false);
        
        // Only redirect to login if on a protected page
        const currentPath = location.pathname;
        if (currentPath.includes('/dashboard') || 
            currentPath.includes('/profile') ||
            currentPath.includes('/admin')) {
          navigate('/login', { replace: true });
        }
      }
    };
    
    const loadUserProfile = async (userId: string) => {
      try {
        console.log("Index: Loading profile for user:", userId);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error("Index: Error loading profile:", error);
          setIsLoading(false);
          return;
        }
        
        // Carregar as roles do usuário
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
          
        if (rolesError) {
          console.error("Index: Error loading user roles:", rolesError);
        } else {
          const userRolesList = roles?.map(r => r.role) || [];
          console.log("Index: User roles loaded:", userRolesList);
          setUserRoles(userRolesList);
        }
        
        if (profile) {
          console.log("Index: Profile loaded successfully:", profile);
          const { data: { user } } = await supabase.auth.getUser();
          
          const userData: User = {
            id: profile.id,
            name: profile.name || user?.user_metadata?.name || profile.email?.split('@')[0] || "Usuário",
            email: profile.email || user?.email || "",
            userType: profile.user_type as "client" | "provider" | "owner",
            avatarUrl: profile.avatar_url,
            phoneNumber: profile.phone_number,
            roles: userRolesList
          };
          
          setCurrentUser(userData);
          console.log("Index: User data set:", userData);
          
          // Redirect from admin page if user isn't admin
          if (location.pathname.includes('/admin') && !userRolesList.includes('admin')) {
            toast({
              title: "Acesso restrito",
              description: "Você não tem permissão para acessar esta página.",
              variant: "destructive",
            });
            navigate('/', { replace: true });
          }
        } else {
          console.log("Index: No profile found, trying to create one");
          
          // Try to create profile from user metadata
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.user_metadata) {
            const newProfile = {
              id: userId,
              name: user.user_metadata.name || user.email?.split('@')[0] || "Usuário",
              email: user.email,
              user_type: user.user_metadata.userType || "client",
              avatar_url: user.user_metadata.avatar_url
            };
            
            await supabase.from('profiles').insert(newProfile);
            
            const userData: User = {
              id: userId,
              name: newProfile.name,
              email: newProfile.email || "",
              userType: newProfile.user_type as "client" | "provider" | "owner",
              avatarUrl: newProfile.avatar_url,
              phoneNumber: null,
              roles: userRolesList
            };
            
            setCurrentUser(userData);
          } else {
            console.error("Index: No user metadata available to create profile");
            setCurrentUser(null);
          }
        }
      } catch (error) {
        console.error("Index: Error in loadUserProfile:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
    
    return () => {
      console.log("Index: Cleaning up auth listeners");
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    console.log("Index: Logging out user");
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserRoles([]);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema"
    });
    
    navigate("/");
  };

  // Determine if we're on a page that needs authentication
  const isAuthRequired = location.pathname.includes('/dashboard') || 
                         location.pathname.includes('/profile') ||
                         location.pathname.includes('/admin');

  // Only show loading indicator for pages that require authentication
  const showLoading = isLoading && isAuthRequired;

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar currentUser={currentUser} onLogout={handleLogout} />
      <main className="flex-1">
        {showLoading ? (
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
      <Footer userRoles={userRoles} />
    </div>
  );
};

export default Index;
