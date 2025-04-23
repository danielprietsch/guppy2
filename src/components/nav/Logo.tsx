
import { Link } from "react-router-dom";

export const Logo = () => {
  return (
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
  );
};
