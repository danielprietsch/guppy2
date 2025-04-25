
import React, { useState } from "react";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, Filter } from "lucide-react";
import { format, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProfessionals } from "@/hooks/useProfessionals";

const ProfessionalsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const today = new Date();
  
  const { 
    professionals, 
    specialties, 
    isLoading 
  } = useProfessionals({ 
    withSpecialties: true,
    withAvailability: false, // We'll filter locally to keep all professionals visible
    date: selectedDate
  });
  
  // Filter professionals by search query and specialty
  const filteredProfessionals = professionals.filter(professional => {
    // Filter by search query (name)
    const matchesSearch = professional.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by specialty if one is selected
    const matchesSpecialty = !selectedSpecialty || 
      (professional.specialties && professional.specialties.includes(selectedSpecialty));
    
    return matchesSearch && matchesSpecialty;
  });
  
  // Get next 7 days for quick date selection
  const nextDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
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
      
      {/* Quick date selection */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2">
        {nextDays.map((date, index) => (
          <Button
            key={index}
            variant={isSameDay(date, selectedDate) ? "default" : "outline"}
            className="whitespace-nowrap"
            onClick={() => setSelectedDate(date)}
          >
            {index === 0 ? "Hoje" : format(date, 'EEE, dd MMM', { locale: ptBR })}
          </Button>
        ))}
      </div>
      
      {/* Filters section */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <SelectItem value="">Todas as especialidades</SelectItem>
            {specialties.map((specialty) => (
              <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date || new Date())}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Applied filters */}
      {selectedSpecialty && (
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
              <ProfessionalCard key={professional.id} professional={professional} />
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
