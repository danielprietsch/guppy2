
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cabin, Location } from "@/lib/types";
import { useNavigate } from "react-router-dom";

interface CabinSearchSectionProps {
  cabins: Cabin[];
  locationDetails: Location | null;
  isLoading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectCabin: (cabin: Cabin) => void;
  selectedCabin: Cabin | null;
}

export const CabinSearchSection = ({
  cabins,
  locationDetails,
  isLoading,
  searchTerm,
  setSearchTerm,
  onSelectCabin,
  selectedCabin
}: CabinSearchSectionProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {cabins.length > 0 ? 'Espaços Disponíveis' : 'Reservar Espaço de Trabalho'}
        </h1>
        
        <div className="relative w-full sm:max-w-xs">
          <Input
            type="text"
            placeholder="Buscar espaços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {cabins.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Espaços Disponíveis</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p>Carregando espaços...</p>
            ) : (
              cabins.map((cabin) => (
                <Card 
                  key={cabin.id} 
                  className={`overflow-hidden h-auto transition-colors ${
                    selectedCabin?.id === cabin.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="p-4">
                    {/* Display Location Name at the top */}
                    {locationDetails && (
                      <h2 className="text-lg font-bold text-primary mb-1">
                        {locationDetails.name}
                      </h2>
                    )}
                    
                    {/* Cabin Name */}
                    <h3 className="font-semibold text-xl mb-2">{cabin.name}</h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {cabin.description}
                    </p>
                    
                    {cabin.equipment && cabin.equipment.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <h4 className="text-sm font-medium mb-1">Equipamentos:</h4>
                        <ul>
                          {cabin.equipment.map((item, index) => (
                            <li 
                              key={index} 
                              className="text-xs flex items-center gap-2 mb-1"
                            >
                              <Check 
                                className="h-4 w-4 text-green-500" 
                                strokeWidth={3}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <Button 
                      className={`w-full mt-4 ${
                        selectedCabin?.id === cabin.id ? 'bg-primary/80' : ''
                      }`}
                      onClick={() => onSelectCabin(cabin)}
                    >
                      {selectedCabin?.id === cabin.id ? 'Espaço Selecionado' : 'Selecionar Espaço'}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
