
import { useState } from "react";
import { locations } from "@/lib/mock-data";
import LocationCard from "@/components/LocationCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const LocationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter locations based on search query
  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.amenities.some(amenity => 
      amenity.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">Encontre o Local Perfeito</h1>
        <p className="mt-4 text-gray-500">
          Descubra espaços equipados para profissionais de beleza em toda a cidade
        </p>
      </div>
      
      <div className="mt-8 flex items-center gap-2 border rounded-lg p-2 max-w-xl mx-auto">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, endereço ou comodidades..."
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.length > 0 ? (
          filteredLocations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium">Nenhum local encontrado</h3>
            <p className="mt-1 text-gray-500">
              Tente ajustar sua busca ou remover filtros
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationsPage;
