
import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img
        src="/lovable-uploads/98c919f3-9c42-4aba-8b8b-f94df3194b31.png"
        alt="Guppy Logo"
        className="h-8"
      />
      <span className="text-xl font-bold text-guppy-tertiary">Guppy</span>
    </Link>
  );
};
