
import React, { useState } from "react";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { User } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProfessionalsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'professional');
      
      if (error) {
        console.error('Error fetching professionals:', error);
        return [];
      }
      
      return data as User[];
    }
  });
  
  // Filter professionals based on search query
  const filteredProfessionals = professionals.filter(professional => 
    professional.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (professional.specialties && professional.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );
  
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
      
      <div className="mt-8 flex items-center gap-2 border rounded-lg p-2 max-w-xl mx-auto">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou especialidade..."
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {isLoading ? (
        <div className="mt-12 text-center">
          <p>Carregando profissionais...</p>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredProfessionals.length > 0 ? (
            filteredProfessionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium">Nenhum profissional encontrado</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery 
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
