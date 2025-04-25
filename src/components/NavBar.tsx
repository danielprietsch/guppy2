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
          setLoading(false);
          return;
        }
        
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        const nameFromMetadata = userMetadata?.name;
        const avatarFromMetadata = userMetadata?.avatar_url;
        
        console.log("NavBar: Checking auth with user metadata:", {
          userType: userTypeFromMetadata,
          name: nameFromMetadata,
          avatar: avatarFromMetadata
        });
        
        if (userTypeFromMetadata) {
          const userData: User = {
            id: session.user.id,
            name: nameFromMetadata || session.user.email?.split('@')[0] || "User",
            email: session.user.email || "",
            user_type: userTypeFromMetadata as "professional" | "client" | "owner" | "global_admin",
            avatarUrl: avatarFromMetadata,
          };
          
          console.log("NavBar: Setting user from metadata:", userData);
          setCurrentUser(userData);
          
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (profileError) {
              console.log("NavBar: No profile found in database, using metadata only");
            } else if (profileData) {
              console.log("NavBar: Profile found, updating with data:", profileData);
              setCurrentUser(prevUser => ({
                ...prevUser!,
                name: profileData.name || prevUser!.name,
                avatarUrl: profileData.avatar_url || prevUser!.avatarUrl,
                phoneNumber: profileData.phone_number,
              }));
            }
          } catch (err) {
            console.error("Error fetching profile:", err);
          }
        } else {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError || !profileData) {
            console.error("Error fetching user profile:", profileError);
            setCurrentUser(null);
            setLoading(false);
            return;
          }
          
          const userData: User = {
            id: profileData.id,
            name: profileData.name || session.user.email?.split('@')[0] || "User",
            email: profileData.email || session.user.email || "",
            user_type: profileData.user_type as "professional" | "client" | "owner" | "global_admin",
            avatarUrl: profileData.avatar_url,
            phoneNumber: profileData.phone_number,
          };
          
          console.log("NavBar: User data loaded from database:", userData);
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event);
        if (event === "SIGNED_OUT") {
          setCurrentUser(null);
        } else if (session) {
          if (session.user.user_metadata?.userType) {
            const initialUserData: User = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || "User",
              email: session.user.email || "",
              user_type: session.user.user_metadata?.userType,
              avatarUrl: session.user.user_metadata?.avatar_url,
            };
            setCurrentUser(initialUserData);
          }
          
          checkAuth();
        }
      }
    );
    
    const channel = supabase
      .channel('navbar-profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          if (currentUser && payload.new.id === currentUser.id) {
            console.log("NavBar: Profile updated in real-time:", payload.new);
            setCurrentUser(prev => {
              if (!prev) return null;
              return {
                ...prev,
                name: payload.new.name || prev.name,
                avatarUrl: payload.new.avatar_url,
                phoneNumber: payload.new.phone_number,
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        toast({
          title: "Erro",
          description: "Não foi possível desconectar. Tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentUser(null);
      
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
              onClick={() => navigate("/locations")}
              size="icon" 
              variant="outline"
              title="Pesquisar locais e cabines"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Pesquisar locais e cabines</span>
            </Button>
          </div>

          {currentUser ? (
            <UserMenu user={currentUser} signOut={handleLogout} />
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
