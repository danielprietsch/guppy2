
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  currentUser: User;
  onLogout: () => void;
}

export const UserMenu = ({ currentUser, onLogout }: UserMenuProps) => {
  console.log("UserMenu received user:", currentUser);
  
  if (!currentUser) {
    console.error("UserMenu rendered with no user data!");
    return null;
  }

  // Determine dashboard and profile routes based on user type
  const dashboardRoute = 
    currentUser.userType === "provider"
      ? "/provider/dashboard"
      : currentUser.userType === "owner"
      ? "/owner/dashboard"
      : "/client/dashboard";
      
  const profileRoute = 
    currentUser.userType === "provider"
      ? "/provider/profile"
      : currentUser.userType === "owner"
      ? "/owner/profile"
      : "/client/profile";

  // Extract first letter of name for avatar fallback
  const firstLetter = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';
  
  // Debug output
  console.log("Avatar URL:", currentUser.avatarUrl);
  console.log("User name:", currentUser.name);
  console.log("First letter for avatar:", firstLetter);

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
          <Avatar className="h-8 w-8">
            {currentUser.avatarUrl ? (
              <AvatarImage 
                src={currentUser.avatarUrl} 
                alt={currentUser.name || "User"} 
                onError={(e) => {
                  console.error("Avatar image failed to load");
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary font-bold uppercase">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hover:underline hidden md:inline-block">
            {currentUser.name || "Usuário"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link to={dashboardRoute}>
              Meu Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={profileRoute}>
              Meu Perfil
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        onClick={onLogout}
        className="text-gray-500 hover:text-gray-700 flex items-center gap-2"
      >
        <LogOut className="h-5 w-5" />
        <span>Sair</span>
      </Button>
    </div>
  );
};
