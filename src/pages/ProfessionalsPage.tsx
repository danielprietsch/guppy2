
import React, { useState } from "react";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, AlertCircle } from "lucide-react";
import { addDays } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProfessionals } from "@/hooks/useProfessionals";
import { useServices } from "@/hooks/useServices";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const ProfessionalsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const today = new Date();
  const nextWeek = addDays(today, 7);
  
  const { services } = useServices();
  const { 
    data: professionals = [], 
    isLoading,
    isError,
  } = useProfessionals({ 
    withSpecialties: true,
    withAvailability: true,
    date: nextWeek
  });

  console.log("Professional count:", professionals?.length || 0);

  const filteredProfessionals = professionals?.filter(professional => {
    const matchesSearch = professional.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService = selectedServices.length === 0 || 
      professional.specialties?.some(specialty => selectedServices.includes(specialty));
    return matchesSearch && matchesService;
  }) || [];
  
  const uniqueCategories = Array.from(new Set(services.map(service => service.category)));
  
  const toggleService = (category: string) => {
    setSelectedServices(current => 
      current.includes(category)
        ? current.filter(s => s !== category)
        : [...current, category]
    );
  };

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Profissionais de Qualidade
        </h1>
        <p className="mt-4 text-gray-500">
          Encontre os melhores profissionais de beleza e estética
        </p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-6">
          Profissionais disponíveis nos próximos 7 dias:
        </h2>
      </div>
      
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center gap-2 border rounded-lg p-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 w-full p-2 border rounded-lg bg-background hover:bg-accent/50 transition-colors">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                {selectedServices.length === 0 
                  ? "Filtrar por serviços" 
                  : `${selectedServices.length} serviço(s) selecionado(s)`
                }
              </span>
              <div className="ml-auto flex gap-1">
                {selectedServices.length > 0 && selectedServices.slice(0, 2).map((service) => (
                  <Badge key={service} variant="secondary" className="max-w-[100px] truncate">
                    {service}
                  </Badge>
                ))}
                {selectedServices.length > 2 && (
                  <Badge variant="secondary">+{selectedServices.length - 2}</Badge>
                )}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <ScrollArea className="h-80">
              <div className="space-y-4 p-2">
                <h4 className="font-medium">Serviços disponíveis</h4>
                <div className="space-y-2">
                  {uniqueCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedServices.includes(category)}
                        onCheckedChange={() => toggleService(category)}
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
      
      {isError && (
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Ocorreu um erro ao carregar os profissionais. Por favor, tente novamente mais tarde.
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden border">
              <Skeleton className="h-64 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/4" />
                <div className="mt-2">
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="flex gap-1 mt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          {filteredProfessionals.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProfessionals.map((professional) => (
                <ProfessionalCard key={professional.id} professional={professional} />
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center py-16 border rounded-lg bg-gray-50">
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                Não foram encontrados profissionais disponíveis
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não foram encontrados profissionais disponíveis com cabines reservadas na data solicitada
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
