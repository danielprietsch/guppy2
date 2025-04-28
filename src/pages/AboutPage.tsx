
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCheck, Users, Building, Award } from "lucide-react";

const AboutPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_500px] lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Sobre o Guppy
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Conectando profissionais de beleza a espaços adequados para atender seus clientes com praticidade e segurança.
                </p>
              </div>
              <p className="text-gray-500 md:text-lg">
                Fundada em 2025, a Guppy nasceu da necessidade de criar um ambiente flexível para profissionais autônomos da área da beleza, permitindo que eles atendam seus clientes em espaços profissionais sem precisar investir em um salão próprio.
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1470259078422-826894b933aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGd1cHB5JTIwZmlzaHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=500&q=60"
              alt="Guppy"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:aspect-square"
            />
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3 md:gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCheck className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Missão</h2>
              <p className="mt-2 text-gray-500">
                Facilitar o acesso a espaços profissionais para prestadores de serviços, promovendo autonomia e crescimento profissional.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Visão</h2>
              <p className="mt-2 text-gray-500">
                Ser a principal plataforma de conexão entre profissionais de beleza e espaços de trabalho, transformando a maneira como os serviços de beleza são oferecidos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mt-4 text-xl font-bold">Valores</h2>
              <p className="mt-2 text-gray-500">
                Qualidade, flexibilidade, comunidade, inovação e transparência em todas as nossas operações e relacionamentos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-primary/5 py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Nossa Equipe</h2>
            <p className="mt-4 text-gray-500">
              Conheça as pessoas por trás da Guppy
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3 md:gap-8 lg:grid-cols-4">
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 overflow-hidden rounded-full">
                <img
                  src="https://randomuser.me/api/portraits/women/32.jpg"
                  alt="Ana Rodrigues"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium">Ana Rodrigues</h3>
              <p className="text-sm text-gray-500">CEO & Co-Fundadora</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 overflow-hidden rounded-full">
                <img
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="Ricardo Santos"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium">Ricardo Santos</h3>
              <p className="text-sm text-gray-500">CTO & Co-Fundador</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 overflow-hidden rounded-full">
                <img
                  src="https://randomuser.me/api/portraits/women/68.jpg"
                  alt="Mariana Silva"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium">Mariana Silva</h3>
              <p className="text-sm text-gray-500">COO</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-40 w-40 overflow-hidden rounded-full">
                <img
                  src="https://randomuser.me/api/portraits/men/42.jpg"
                  alt="José Oliveira"
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-lg font-medium">José Oliveira</h3>
              <p className="text-sm text-gray-500">Head de Marketing</p>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Nossa História</h2>
            <p className="mt-4 text-gray-500">
              Uma breve jornada da criação até hoje
            </p>
          </div>
          <div className="mt-12 space-y-8">
            <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
              <div className="flex flex-col items-center md:items-end">
                <div className="text-xl font-bold">2025</div>
                <div className="mt-1 text-sm text-gray-500">Janeiro</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Fundação da Guppy</h3>
                <p className="mt-2 text-gray-500">
                  Ana Rodrigues e Ricardo Santos fundam a Guppy com a ideia de revolucionar a maneira como profissionais de beleza trabalham.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
              <div className="flex flex-col items-center md:items-end">
                <div className="text-xl font-bold">2025</div>
                <div className="mt-1 text-sm text-gray-500">Março</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Primeira Unidade</h3>
                <p className="mt-2 text-gray-500">
                  Inauguração da primeira unidade no centro de São Paulo com 8 cabines equipadas para diversos serviços de beleza.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
              <div className="flex flex-col items-center md:items-end">
                <div className="text-xl font-bold">2025</div>
                <div className="mt-1 text-sm text-gray-500">Junho</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Lançamento da Plataforma</h3>
                <p className="mt-2 text-gray-500">
                  Lançamento oficial da plataforma Guppy, permitindo que profissionais reservem cabines e clientes encontrem serviços em um único lugar.
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
              <div className="flex flex-col items-center md:items-end">
                <div className="text-xl font-bold">2025</div>
                <div className="mt-1 text-sm text-gray-500">Setembro</div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Expansão</h3>
                <p className="mt-2 text-gray-500">
                  Abertura de duas novas unidades em São Paulo e início dos planos de expansão para outras cidades.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5">
        <div className="container px-4 py-16 md:px-6 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Junte-se a Nós</h2>
            <p className="mt-4 text-gray-500">
              Seja parte da revolução no setor de beleza e estética. 
              Cadastre-se agora e comece a usar a plataforma Guppy.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link to="/register">
                <Button size="lg">Criar Conta</Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline">
                  Entre em Contato
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
