
import { Link, useNavigate } from "react-router-dom";
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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UserMenuProps {
  currentUser: User;
  onLogout: () => void;
}

export const UserMenu = ({ currentUser, onLogout }: UserMenuProps) => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Effect to update avatar URL whenever currentUser changes
  useEffect(() => {
    if (currentUser?.avatarUrl) {
      console.log("UserMenu: Setting avatar URL from currentUser:", currentUser.avatarUrl);
      setAvatarUrl(currentUser.avatarUrl);
      
      // Add a cache-busting parameter to force refresh
      if (currentUser.avatarUrl.includes('?')) {
        setAvatarUrl(`${currentUser.avatarUrl}&t=${new Date().getTime()}`);
      } else {
        setAvatarUrl(`${currentUser.avatarUrl}?t=${new Date().getTime()}`);
      }
    }
  }, [currentUser]);
  
  // Subscribe to profile changes to refresh the avatar when updated elsewhere
  useEffect(() => {
    if (currentUser?.id) {
      console.log("UserMenu: Setting up realtime subscription for profile updates", currentUser.id);
      
      // Listen for both profile updates and auth metadata updates
      const channel = supabase
        .channel('avatar-updates-menu')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${currentUser.id}`,
          },
          (payload) => {
            console.log("UserMenu received profile update:", payload);
            if (payload.new && payload.new.avatar_url) {
              console.log("UserMenu: Updating avatar from realtime event to", payload.new.avatar_url);
              
              // Add a cache-busting parameter
              const newUrl = payload.new.avatar_url;
              if (newUrl.includes('?')) {
                setAvatarUrl(`${newUrl}&t=${new Date().getTime()}`);
              } else {
                setAvatarUrl(`${newUrl}?t=${new Date().getTime()}`);
              }
            }
          }
        )
        .subscribe();

      // Also fetch the latest profile data to ensure we have the most recent avatar
      const fetchLatestProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', currentUser.id)
            .single();
            
          if (error) throw error;
          
          if (data && data.avatar_url) {
            console.log("UserMenu: Fetched latest avatar from DB:", data.avatar_url);
            // Add a cache-busting parameter
            if (data.avatar_url.includes('?')) {
              setAvatarUrl(`${data.avatar_url}&t=${new Date().getTime()}`);
            } else {
              setAvatarUrl(`${data.avatar_url}?t=${new Date().getTime()}`);
            }
          }
        } catch (error) {
          console.error("Error fetching latest profile:", error);
        }
      };
      
      fetchLatestProfile();

      return () => {
        console.log("UserMenu: Cleaning up realtime subscription");
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser?.id]);

  // If we don't have user data, don't render anything
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
      // Call the parent component's onLogout callback
      onLogout();
      
      // Navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível desconectar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Use the most up-to-date avatar URL
  const displayAvatarUrl = avatarUrl || currentUser.avatarUrl;

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 focus:outline-none">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage 
              src={displayAvatarUrl || undefined}
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
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
