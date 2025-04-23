
import * as React from "react";
import { Link } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Menu, Search, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavBarProps {
  currentUser?: User | null;
}

const NavBar: React.FC<NavBarProps> = ({ currentUser }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          <span className="text-xl font-bold">Guppy</span>
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
              <Link to={currentUser.userType === "provider" ? "/provider/dashboard" : "/client/dashboard"}>
                <span className="text-sm font-medium hover:underline hidden md:inline-block">
                  {currentUser.name}
                </span>
                <div className="size-8 rounded-full overflow-hidden border">
                  {currentUser.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                </div>
              </Link>
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
