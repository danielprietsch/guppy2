
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { Menu, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Logo } from "./nav/Logo";
import { NavigationLinks } from "./nav/NavigationLinks";
import { UserMenu } from "./nav/UserMenu";
import { MobileMenu } from "./nav/MobileMenu";
import { supabase } from "@/integrations/supabase/client";

interface NavBarProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser: propUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const navigate = useNavigate();

  // Sincronizar com o estado de autenticação do Supabase
  React.useEffect(() => {
    // First priority: use propUser if available
    if (propUser) {
      console.log("NavBar using propUser:", propUser);
      setCurrentUser(propUser);
      return;
    }
    
    // Verificar autenticação no Supabase
    const checkSupabaseAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Buscar perfil do usuário
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
          
          console.log("NavBar: User authenticated via Supabase:", userData);
          setCurrentUser(userData);
        } else {
          console.log("NavBar: User authenticated but no profile found");
          setCurrentUser(null);
        }
      } else {
        console.log("NavBar: No user authenticated in Supabase");
        setCurrentUser(null);
      }
    };
    
    checkSupabaseAuth();
    
    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("NavBar: Auth state changed:", event);
        if (event === "SIGNED_IN" && session?.user) {
          // Recarregar dados do usuário
          checkSupabaseAuth();
        } else if (event === "SIGNED_OUT") {
          console.log("NavBar: User signed out");
          setCurrentUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [propUser]);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
    
    // Logout do Supabase
    await supabase.auth.signOut();
    
    // Remove user from localStorage
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema",
    });
    
    navigate("/");
  };

  // Debug output for NavBar render
  console.log("NavBar rendering with currentUser:", currentUser);

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
          <div className="hidden md:block">
            <Link to="/search">
              <Button size="icon" variant="outline">
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </Link>
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
