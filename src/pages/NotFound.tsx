
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="text-xl font-semibold">Página não encontrada</h2>
        <p className="text-gray-500">
          Desculpe, não conseguimos encontrar a página que você está procurando.
        </p>
        <Link to="/">
          <Button className="mt-4">Voltar para a página inicial</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
