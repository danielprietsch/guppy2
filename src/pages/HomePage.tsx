
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { locations, users } from "@/lib/mock-data";
import LocationCard from "@/components/LocationCard";
import ProviderCard from "@/components/ProviderCard";
import { ArrowRight, CheckCircle, Search, Star } from "lucide-react";

const HomePage = () => {
  // Filter users to only include providers
  const providers = users.filter((user) => user.userType === "provider");
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background">
        <div className="container px-4 py-20 md:px-6 md:py-24">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Encontre o espaço ideal para seus serviços de beleza
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl">
                  Guppy conecta profissionais da beleza com espaços totalmente equipados para atender seus clientes. Alugue cabines por turno e impulsione seu negócio.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="/locations">
                  <Button size="lg">Ver Locais Disponíveis</Button>
                </Link>
                <Link to="/providers">
                  <Button size="lg" variant="outline">
                    Encontrar Profissionais
                  </Button>
                </Link>
                <Link to="/register?userType=owner">
                  <Button size="lg" variant="secondary">
                    Seja um Franqueado
                  </Button>
                </Link>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c2Fsb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60"
              alt="Salão de beleza"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:aspect-square"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Como Funciona</h2>
          <p className="mt-4 text-gray-500">
            Um processo simples para encontrar ou oferecer serviços de qualidade
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">1. Encontre</h3>
            <p className="mt-2 text-gray-500">
              {providers.length > 0 ? "Clientes encontram profissionais" : "Prestadores encontram cabines"} que atendam suas necessidades.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">2. Reserve</h3>
            <p className="mt-2 text-gray-500">
              {providers.length > 0 ? "Marque um horário com o profissional" : "Reserve uma cabine no local de sua preferência"}.
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Star className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">3. Aproveite</h3>
            <p className="mt-2 text-gray-500">
              {providers.length > 0 ? "Receba um atendimento de qualidade" : "Ofereça seus serviços em um ambiente profissional"}.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Locations Section */}
      <section className="container px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Locais em Destaque</h2>
            <p className="mt-2 text-gray-500">
              Espaços cuidadosamente selecionados para sua conveniência
            </p>
          </div>
          <Link to="/locations" className="mt-4 md:mt-0">
            <Button variant="outline" className="flex items-center gap-2">
              Ver Todos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {locations.slice(0, 3).map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      </section>

      {/* Featured Providers Section */}
      {providers.length > 0 && (
        <section className="container px-4 py-12 md:px-6 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Profissionais em Destaque
              </h2>
              <p className="mt-2 text-gray-500">
                Os melhores prestadores de serviços da nossa plataforma
              </p>
            </div>
            <Link to="/providers" className="mt-4 md:mt-0">
              <Button variant="outline" className="flex items-center gap-2">
                Ver Todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary/5">
        <div className="container px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Pronto para começar?
            </h2>
            <p className="mt-4 text-gray-500">
              Junte-se a nossa comunidade de profissionais e clientes. 
              Transforme a maneira como você trabalha ou encontra serviços de beleza.
            </p>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg">Criar Conta</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Fale Conosco
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

