
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, CalendarDays, MapPin, Users } from "lucide-react";
import { locations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import ProfessionalCard from "@/components/ProfessionalCard";
import LocationCard from "@/components/LocationCard";
import { useProfessionals } from "@/hooks/useUsers";

const HomePage = () => {
  const { data: professionals = [], isLoading: loadingProfessionals } = useProfessionals();
  
  // Filter featured professionals (3 for the home page)
  const featuredProfessionals = professionals.slice(0, 3);

  // Filter featured locations (3 for the home page)
  const featuredLocations = locations.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/90 to-primary/70 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/20" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h1 
                className="text-4xl md:text-5xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Espaço para Profissionais da Beleza
              </motion.h1>
              
              <motion.p 
                className="text-lg text-white/90 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Cabines equipadas para aluguel diário ou mensal para cabeleireiros, manicures, esteticistas e outros profissionais da beleza.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button asChild size="lg" className="font-semibold">
                  <Link to="/register">Cadastre-se Gratuitamente</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  <Link to="/locations">Ver Localização</Link>
                </Button>
              </motion.div>
            </div>
            
            <motion.div 
              className="relative hidden md:block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=80" 
                alt="Salon Space" 
                className="rounded-lg shadow-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="text-primary h-5 w-5" />
                  <span className="font-medium">Reserva Flexível</span>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="text-primary h-5 w-5" />
                  <span className="font-medium">Ótima Localização</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Como Funciona</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Para Profissionais</h3>
              <p className="text-gray-600 mb-4">Alugue espaços equipados por dia ou mês para atender seus clientes com flexibilidade e sem burocracia.</p>
              <Link to="/register" className="text-primary font-medium inline-flex items-center">
                Saiba mais <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Localizações</h3>
              <p className="text-gray-600 mb-4">Encontre espaços em pontos estratégicos da cidade, de fácil acesso para você e seus clientes.</p>
              <Link to="/locations" className="text-primary font-medium inline-flex items-center">
                Ver localizações <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarDays className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reservas</h3>
              <p className="text-gray-600 mb-4">Sistema de reservas simples e rápido. Escolha o dia, período e confirme sua reserva em poucos cliques.</p>
              <Link to="/register" className="text-primary font-medium inline-flex items-center">
                Comece agora <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Professionals */}
      <section className="py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Profissionais em Destaque</h2>
            <Link to="/professionals" className="text-primary font-medium inline-flex items-center">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loadingProfessionals ? (
              <p className="col-span-full text-center py-4">Carregando profissionais...</p>
            ) : featuredProfessionals.length > 0 ? (
              featuredProfessionals.map((professional) => (
                <ProfessionalCard key={professional.id} professional={professional} />
              ))
            ) : (
              <p className="col-span-full text-center py-4">Nenhum profissional cadastrado no momento</p>
            )}
          </div>
        </div>
      </section>
      
      {/* Featured Locations */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Locais em Destaque</h2>
            <Link to="/locations" className="text-primary font-medium inline-flex items-center">
              Ver todos <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="flex flex-col space-y-6">
            {featuredLocations.map((location) => (
              <LocationCard key={location.id} location={location} displayLayout="compact" />
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Pronto para começar?</h2>
            <p className="text-white/90 text-lg mb-8">
              Junte-se a nossa comunidade de profissionais da beleza e transforme a maneira como você trabalha.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="font-semibold">
                <Link to="/register">Cadastre-se Gratuitamente</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Link to="/about">Saiba mais</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
