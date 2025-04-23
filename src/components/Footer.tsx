
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-[#D6BCFA]/10 to-[#9b87f5]/10 border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
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
            <p className="mt-4 text-sm text-gray-600">
              Conectamos profissionais de beleza a espaços adequados para trabalhar.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Plataforma</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/locations" className="text-sm text-gray-600 hover:text-gray-900">
                  Locais
                </Link>
              </li>
              <li>
                <Link to="/providers" className="text-sm text-gray-600 hover:text-gray-900">
                  Prestadores
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-gray-600 hover:text-gray-900">
                  Preços
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Empresa</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                  Contato
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-gray-600 hover:text-gray-900">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-gray-600 hover:text-gray-900">
                  Carreiras
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Termos
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-sm text-gray-600 hover:text-gray-900">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Guppy. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
