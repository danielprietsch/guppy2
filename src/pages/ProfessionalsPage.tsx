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
import { useProfessionals, Professional } from "@/hooks/useProfessionals";
import { serviceData } from "@/utils/serviceData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const ProfessionalsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const today = new Date();
  const nextWeek = today;

  // Get all unique categories from serviceData
  const allServices = Object.values(serviceData)
    .map(service => service.category)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  
  const { 
    data: professionals = [], 
    isLoading,
    isError,
  } = useProfessionals({ 
    withSpecialties: true,
    withAvailability: true,
    date: nextWeek
  });

  // Ensure professionals is always treated as an array
  const professionalsList = Array.isArray(professionals) ? professionals : [];
  
  const filteredProfessionals = professionalsList.filter(professional => {
    const matchesSearch = professional.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesService = selectedServices.length === 0 || 
      professional.specialties?.some(specialty => selectedServices.includes(specialty));
    return matchesSearch && matchesService;
  });
  
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
          Profissionais Qualificados
        </h1>
        <p className="mt-4 text-gray-500">
          Encontre os melhores profissionais para o seu serviço
        </p>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center gap-2 border rounded-lg p-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do profissional..."
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
              <div className="ml-auto flex gap-1 overflow-hidden">
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
          <PopoverContent className="w-80" align="start">
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Serviços Disponíveis</h4>
                <div className="grid grid-cols-1 gap-3">
                  {allServices.map((service) => (
                    <label
                      key={service}
                      className="flex items-center space-x-3 hover:bg-accent rounded-lg p-2 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={service}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <span className="text-sm font-medium leading-none">
                        {service}
                      </span>
                    </label>
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
                Nenhum profissional encontrado
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não foram encontrados profissionais disponíveis com os filtros selecionados. Tente ajustar sua busca.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
