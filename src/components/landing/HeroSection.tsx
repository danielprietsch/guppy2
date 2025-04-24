
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Encontre o espaço perfeito para seu atendimento
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            O Guppy conecta profissionais de beleza a espaços equipados para atendimento.
            Reserve sua cabine por turno e comece a atender seus clientes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button 
              asChild
              className="bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary"
            >
              <Link to="/locations">
                Ver locais disponíveis
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
            >
              <Link to="/register">
                Seja um franqueado
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
