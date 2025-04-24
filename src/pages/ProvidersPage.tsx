
import React, { useState } from "react";
import { users } from "@/lib/mock-data";
import ProfessionalCard from "@/components/ProfessionalCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { User } from "@/lib/types";

const ProfessionalsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter users to only include professionals
  const professionals: User[] = users.filter((user) => user.userType === "professional");
  
  // Filter professionals based on search query
  const filteredProfessionals = professionals.filter(professional => 
    professional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredProfessionals.length > 0 ? (
          filteredProfessionals.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium">Nenhum profissional encontrado</h3>
            <p className="mt-1 text-gray-500">
              Tente ajustar sua busca ou remover filtros
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalsPage;
