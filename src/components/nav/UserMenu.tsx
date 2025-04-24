
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserMenuProps {
  currentUser: User;
  onLogout: () => void;
}

export const UserMenu = ({ currentUser, onLogout }: UserMenuProps) => {
  if (!currentUser) {
    console.error("UserMenu rendered with no user data!");
    return null;
  }

  // Determine dashboard and profile routes based on user type
  const dashboardRoute = currentUser.user_type === "global_admin"
    ? "/admin/global"
    : currentUser.user_type === "professional"
    ? "/professional/dashboard"
    : currentUser.user_type === "owner"
    ? "/owner/dashboard"
    : "/client/dashboard";
      
  const profileRoute = currentUser.user_type === "global_admin"
    ? "/admin/profile"
    : currentUser.user_type === "professional"
    ? "/professional/profile"
    : currentUser.user_type === "owner"
    ? "/owner/profile"
    : "/client/profile";

  // Extract first letter of name for avatar fallback
  const firstLetter = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage 
              src={currentUser.avatarUrl || undefined}
              alt={currentUser.name || "User"} 
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {firstLetter}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hover:underline hidden md:inline-block">
            {currentUser.name || "Usuário"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{currentUser.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to={dashboardRoute} className="cursor-pointer">
              Meu Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={profileRoute} className="cursor-pointer">
              Meu Perfil
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
