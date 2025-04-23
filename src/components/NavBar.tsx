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

interface NavBarProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser: propUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const navigate = useNavigate();

  // Check local storage for user data on initial render and when propUser changes
  React.useEffect(() => {
    // Priority: use propUser if available
    if (propUser) {
      console.log("Using propUser:", propUser);
      setCurrentUser(propUser);
      return;
    }
    
    // Otherwise try to load from localStorage
    try {
      const storedUserJson = localStorage.getItem("currentUser");
      console.log("Stored user JSON:", storedUserJson);
      
      if (storedUserJson) {
        const parsedUser = JSON.parse(storedUserJson);
        console.log("Parsed user from localStorage:", parsedUser);
        setCurrentUser(parsedUser);
      } else {
        console.log("No user found in localStorage");
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
    }
  }, [propUser]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    
    // Remove user from localStorage
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema",
    });
    
    navigate("/");
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
