
import React, { useState, useEffect } from "react";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Input } from "@/components/ui/input";
import { Search, Filter, AlertCircle, Calendar } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { addDays, format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

const ProfessionalsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get all unique categories from serviceData and initialize selectedServices with all of them
  const allServices = Object.values(serviceData)
    .map(service => service.category)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  
  const [selectedServices, setSelectedServices] = useState<string[]>(allServices);
  
  // Initialize with current date and 'month' mode as default
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateMode, setDateMode] = useState<'day' | 'month'>('month');
  
  console.log("ProfessionalsPage: Rendering with date", selectedDate, "in mode", dateMode);
  console.log("Current selected services:", selectedServices);

  const { 
    data: professionals = [], 
    isLoading,
    isError,
    error,
    refetch,
  } = useProfessionals({ 
    withSpecialties: false,
    withAvailability: false,
    date: null, // Don't filter by date
    ignoreAvailability: true // Always show all professionals
  });

  useEffect(() => {
    // Force an immediate refetch when component mounts to ensure we have fresh data
    refetch();
  }, [refetch]);

  // Show error toast if query fails
  useEffect(() => {
    if (isError && error) {
      toast({
        title: "Erro ao carregar profissionais",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  console.log("ProfessionalsPage: Raw professionals data received:", professionals);
  
  const professionalsList = Array.isArray(professionals) ? professionals : [];
  console.log("ProfessionalsPage: Professionals list after conversion:", professionalsList.length);
  
  const filteredProfessionals = professionalsList.filter(professional => {
    // Include any professional with a name (don't filter out based on no name)
    const matchesSearch = !searchQuery || 
      (professional.name && professional.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // If no services are selected, show all. Otherwise, filter by selected services
    // If professional has no specialties, still include them
    const hasSpecialties = professional.specialties && professional.specialties.length > 0;
    
    const matchesService = 
      selectedServices.length === 0 || 
      !hasSpecialties || 
      professional.specialties.some(specialty => selectedServices.includes(specialty));
    
    return matchesSearch && matchesService;
  });
  
  console.log("ProfessionalsPage: Filtered professionals:", filteredProfessionals.length);
  
  const toggleService = (category: string) => {
    setSelectedServices(current => 
      current.includes(category)
        ? current.filter(s => s !== category)
        : [...current, category]
    );
  };

  const toggleAllServices = () => {
    setSelectedServices(current => 
      current.length === allServices.length ? [] : [...allServices]
    );
  };

  const changeDate = (daysToAdd: number) => {
    const newDate = addDays(selectedDate, daysToAdd);
    setSelectedDate(newDate);
    setDateMode('day');
  };

  const setThisMonth = () => {
    const now = new Date();
    setSelectedDate(now);
    setDateMode('month');
  };

  const handleRetryClick = () => {
    console.log("Retry button clicked - forcing refetch of professionals");
    refetch();
    toast({
      title: "Buscando profissionais",
      description: "Atualizando a lista de profissionais...",
      variant: "default",
    });
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
      
      <div className="flex justify-center mt-8 mb-4 gap-2 flex-wrap">
        <Button 
          variant="outline" 
          onClick={() => changeDate(-1)}
        >
          Dia anterior
        </Button>
        <div className="flex items-center px-4 py-2 border rounded-md bg-background">
          <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="font-medium">
            {dateMode === 'day' 
              ? format(selectedDate, "dd/MM/yyyy") 
              : `Mês de ${format(selectedDate, "MMMM yyyy")}`
            }
          </span>
        </div>
        <Button 
          variant="outline" 
          onClick={() => changeDate(1)}
        >
          Próximo dia
        </Button>
        <Button 
          variant={dateMode === 'month' ? 'default' : 'outline'} 
          onClick={setThisMonth}
        >
          Este mês
        </Button>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <span>Filtro atual: </span>
        <span className="font-medium">
          {dateMode === 'day' 
            ? `Dia: ${format(selectedDate, "dd/MM/yyyy")}` 
            : `Mês: ${format(selectedDate, "MMMM yyyy")}`
          }
        </span>
        <span> • </span>
        <span className="font-medium">
          {selectedServices.length === allServices.length 
            ? 'Todos os serviços' 
            : `${selectedServices.length} serviço(s) selecionado(s)`
          }
        </span>
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
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Serviços Disponíveis</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={toggleAllServices}
                    className="text-xs h-7"
                  >
                    {selectedServices.length === allServices.length 
                      ? "Desmarcar todos" 
                      : "Selecionar todos"
                    }
                  </Button>
                </div>
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
            {error && error.message && (
              <div className="mt-2 text-sm opacity-80">
                Detalhes: {error.message}
              </div>
            )}
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
                Não foram encontrados profissionais disponíveis no sistema.
              </p>
              <div className="mt-6 space-y-4">
                <Button 
                  onClick={handleRetryClick}
                  className="mb-2"
                >
                  Tentar novamente
                </Button>
                
                <div className="text-sm text-gray-500">
                  <p>Possíveis motivos:</p>
                  <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                    <li>Não existem profissionais cadastrados no sistema</li>
                    <li>Os profissionais não definiram suas especialidades</li>
                    <li>Os filtros aplicados são muito restritivos</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
