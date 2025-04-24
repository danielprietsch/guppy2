
import { Link } from "react-router-dom";

interface MobileMenuProps {
  isOpen: boolean;
}

export const MobileMenu = ({ isOpen }: MobileMenuProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden p-4 bg-background border-t">
      <nav className="flex flex-col space-y-2">
        <Link to="/" className="text-sm font-medium py-2 hover:underline">
          Home
        </Link>
        <Link to="/locations" className="text-sm font-medium py-2 hover:underline">
          Locais
        </Link>
        <Link to="/professionals" className="text-sm font-medium py-2 hover:underline">
          Profissionais
        </Link>
        <Link to="/about" className="text-sm font-medium py-2 hover:underline">
          Sobre Nós
        </Link>
        <Link to="/contact" className="text-sm font-medium py-2 hover:underline">
          Contato
        </Link>
      </nav>
    </div>
  );
};
