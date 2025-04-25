
import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img
        src="/lovable-uploads/7b9573df-e2ee-4224-89bd-17a9fc3c01a5.png"
        alt="Logo"
        className="h-16 w-16 object-contain"
      />
    </Link>
  );
};
