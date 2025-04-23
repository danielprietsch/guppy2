
import { Link } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export const NavigationLinks = () => {
  return (
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
  );
};
