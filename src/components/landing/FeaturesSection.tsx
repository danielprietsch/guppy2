
import { CalendarDays, MapPin, Shield, Users2 } from "lucide-react";

const features = [
  {
    name: "Reservas por turno",
    description: "Reserve cabines por turno: manhã, tarde ou noite. Flexibilidade para seu negócio.",
    icon: CalendarDays,
  },
  {
    name: "Locais verificados",
    description: "Todos os locais são verificados e aprovados pela nossa equipe.",
    icon: Shield,
  },
  {
    name: "Encontre clientes",
    description: "Conecte-se com novos clientes através da nossa plataforma.",
    icon: Users2,
  },
  {
    name: "Em todo Brasil",
    description: "Locais disponíveis em várias cidades do Brasil.",
    icon: MapPin,
  },
];

export const FeaturesSection = () => {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-guppy-primary">
            Simples e eficiente
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que você precisa para atender seus clientes
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            O Guppy oferece uma plataforma completa para profissionais de beleza encontrarem
            espaços equipados e começarem a atender.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col items-center text-center">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-guppy-primary/10 text-guppy-primary">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <dt className="text-base font-semibold leading-7">{feature.name}</dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};
