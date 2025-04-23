
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

interface UserMenuProps {
  currentUser: User;
  onLogout: () => void;
}

export const UserMenu = ({ currentUser, onLogout }: UserMenuProps) => {
  return (
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
          <DropdownMenuLabel>Conta</DropdownMenuLabel>
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
              Meu Dashboard
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
