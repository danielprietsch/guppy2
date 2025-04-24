
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { Menu, Search } from "lucide-react";
import { Logo } from "./nav/Logo";
import { NavigationLinks } from "./nav/NavigationLinks";
import { UserMenu } from "./nav/UserMenu";
import { MobileMenu } from "./nav/MobileMenu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setCurrentUser(null);
          return;
        }
        
        // First, check if user metadata contains user type information
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        const nameFromMetadata = userMetadata?.name;
        const avatarFromMetadata = userMetadata?.avatar_url;
        
        if (userTypeFromMetadata) {
          // If metadata has user info, use that first (it's most reliable)
          console.log("NavBar: Using user data from metadata:", userMetadata);
          
          const userData: User = {
            id: session.user.id,
            name: nameFromMetadata || session.user.email?.split('@')[0] || "User",
            email: session.user.email || "",
            userType: userTypeFromMetadata as "professional" | "client" | "owner" | "global_admin",
            avatarUrl: avatarFromMetadata,
          };
          
          setCurrentUser(userData);
          setLoading(false);
          return;
        }
        
        // Fallback: Fetch user profile from Supabase
        console.log("NavBar: Fetching user profile from database");
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError || !profileData) {
          console.error("Error fetching user profile:", profileError);
          setCurrentUser(null);
          return;
        }
        
        // Map profile data to User type
        const userData: User = {
          id: profileData.id,
          name: profileData.name || session.user.email?.split('@')[0] || "User",
          email: profileData.email || session.user.email || "",
          userType: profileData.user_type as "professional" | "client" | "owner" | "global_admin",
          avatarUrl: profileData.avatar_url,
          phoneNumber: profileData.phone_number,
        };
        
        console.log("NavBar: User data loaded:", userData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error checking auth:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event);
        if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        } else if (session) {
          checkAuth();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const navigateToSearch = () => {
    navigate("/locations");
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="block md:hidden"
        >
          <Menu size={24} />
        </button>

        <div className={`${isMenuOpen ? "block" : "hidden"} md:block`}>
          <NavigationLinks />
        </div>

        <div className="flex items-center gap-4">
          <div className="block">
            <Button 
              onClick={navigateToSearch}
              size="icon" 
              variant="outline"
              title="Pesquisar locais e cabines"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Pesquisar locais e cabines</span>
            </Button>
          </div>

          {currentUser ? (
            <UserMenu currentUser={currentUser} onLogout={handleLogout} />
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Cadastrar</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <MobileMenu isOpen={isMenuOpen} />
    </header>
  );
};

export default NavBar;
