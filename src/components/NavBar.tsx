
import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Search, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavBarProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    toast({
      title: "Logout realizado com sucesso",
      description: "Você foi desconectado do sistema",
    });
    navigate("/");
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 80"
            className="h-8 w-8 text-guppy-primary"
          >
            <path
              d="M30 40 C50 25, 70 25, 90 40 C70 55, 50 55, 30 40"
              fill="#9b87f5"
              stroke="#7E69AB"
              strokeWidth="2"
            />
            <path
              d="M90 40 L110 20 Q115 35, 100 50 Z"
              fill="#7E69AB"
            />
            <path
              d="M110 20 L130 10 Q140 20, 120 40 Z"
              fill="#9b87f5"
            />
            <circle cx="45" cy="38" r="3" fill="#1A1F2C" />
          </svg>
          <span className="text-xl font-bold text-guppy-tertiary">Guppy</span>
        </Link>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="block md:hidden"
        >
          <Menu size={24} />
        </button>

        <div className={`${isMenuOpen ? "block" : "hidden"} md:block`}>
          <NavigationMenu>
            <NavigationMenuList className="hidden md:flex gap-6">
              <NavigationMenuItem>
                <Link to="/" className="text-sm font-medium hover:underline">
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/locations" className="text-sm font-medium hover:underline">
                  Locais
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/providers" className="text-sm font-medium hover:underline">
                  Prestadores
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/about" className="text-sm font-medium hover:underline">
                  Sobre Nós
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/contact" className="text-sm font-medium hover:underline">
                  Contato
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
                  <div className="size-8 rounded-full overflow-hidden border">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                        {currentUser.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium hover:underline hidden md:inline-block">
                    {currentUser.name}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      to={
                        currentUser.userType === "provider"
                          ? "/provider/dashboard"
                          : currentUser.userType === "owner"
                          ? "/owner/dashboard"
                          : "/client/dashboard"
                      }
                    >
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      to={
                        currentUser.userType === "provider"
                          ? "/provider/dashboard/editar-perfil"
                          : currentUser.userType === "owner"
                          ? "/owner/dashboard/editar-perfil"
                          : "/client/dashboard/editar-perfil"
                      }
                    >
                      Editar Perfil
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </Button>
            </div>
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

      {isMenuOpen && (
        <div className="md:hidden p-4 bg-background border-t">
          <nav className="flex flex-col space-y-2">
            <Link to="/" className="text-sm font-medium py-2 hover:underline">
              Home
            </Link>
            <Link to="/locations" className="text-sm font-medium py-2 hover:underline">
              Locais
            </Link>
            <Link to="/providers" className="text-sm font-medium py-2 hover:underline">
              Prestadores
            </Link>
            <Link to="/about" className="text-sm font-medium py-2 hover:underline">
              Sobre Nós
            </Link>
            <Link to="/contact" className="text-sm font-medium py-2 hover:underline">
              Contato
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default NavBar;

