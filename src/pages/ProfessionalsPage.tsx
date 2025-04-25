
import React, { useState } from "react";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProfessionals } from "@/hooks/useProfessionals";

const ProfessionalsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  
  const { 
    professionals, 
    specialties, 
    isLoading 
  } = useProfessionals({ 
    withSpecialties: true,
    withAvailability: true,
    date: new Date()
  });
  
  // Filter professionals by search query and specialty
  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = professional.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = !selectedSpecialty || 
      (professional.specialties && professional.specialties.includes(selectedSpecialty));
    
    return matchesSearch && matchesSpecialty;
  });
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Profissionais disponíveis essa semana
        </h1>
        <p className="mt-4 text-gray-500">
          Encontre os melhores profissionais de beleza e estética
        </p>
      </div>
      
      {/* Filters section */}
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
        
        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
          <SelectTrigger className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as especialidades</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Applied filters */}
      {selectedSpecialty && selectedSpecialty !== "all" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            Especialidade: {selectedSpecialty}
            <button
              onClick={() => setSelectedSpecialty("")}
              className="ml-1 rounded-full hover:bg-gray-200 p-1 h-4 w-4 flex items-center justify-center"
            >
              ×
            </button>
          </Badge>
        </div>
      )}
      
      {/* Professionals grid */}
      {isLoading ? (
        <div className="mt-12 text-center">
          <p>Carregando profissionais...</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProfessionals.length > 0 ? (
            filteredProfessionals.map((professional) => (
              <ProfessionalCard 
                key={professional.id} 
                professional={professional} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium">Nenhum profissional encontrado</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery || selectedSpecialty
                  ? "Tente ajustar sua busca ou remover filtros"
                  : "Não há profissionais cadastrados no momento"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionalsPage;
