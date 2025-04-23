
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { User, Location, Cabin } from "@/lib/types";
import { users, locations, cabins } from "@/lib/mock-data";
import { Settings, Users, Calendar, DollarSign, Building } from "lucide-react";

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState("locations");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);

  // Pricing form state
  const [cabinPrice, setCabinPrice] = useState<Record<string, number>>({});

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("currentUser");
    
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    const user = JSON.parse(storedUser) as User;
    
    // Check if user is owner type
    if (user.userType !== "owner") {
      navigate("/");
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentUser(user);
    
    // Get owned locations
    const ownedLocations = locations.filter((location) => 
      user.ownedLocationIds?.includes(location.id)
    );
    
    setUserLocations(ownedLocations);
    
    // Set default selected location
    if (ownedLocations.length > 0) {
      setSelectedLocation(ownedLocations[0]);
      
      // Get cabins for selected location
      const locationCabins = cabins.filter(
        (cabin) => cabin.locationId === ownedLocations[0].id
      );
      
      setLocationCabins(locationCabins);
      
      // Initialize cabin prices
      const initialPrices: Record<string, number> = {};
      locationCabins.forEach((cabin) => {
        // Find a booking for this cabin and use its price
        const cabinBooking = cabins.find((b) => b.id === cabin.id);
        initialPrices[cabin.id] = 100; // Default price
      });
      
      setCabinPrice(initialPrices);
    }
  }, [navigate]);

  const handleLocationChange = (locationId: string) => {
    const location = locations.find((loc) => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      
      // Get cabins for selected location
      const locCabins = cabins.filter((cabin) => cabin.locationId === locationId);
      setLocationCabins(locCabins);
      
      // Initialize cabin prices
      const initialPrices: Record<string, number> = {};
      locCabins.forEach((cabin) => {
        initialPrices[cabin.id] = 100; // Default price
      });
      
      setCabinPrice(initialPrices);
    }
  };

  const handlePriceChange = (cabinId: string, price: string) => {
    setCabinPrice((prev) => ({
      ...prev,
      [cabinId]: parseInt(price) || 0,
    }));
  };

  const handleSavePricing = () => {
    // In a real app, this would update the database
    toast({
      title: "Preços atualizados",
      description: "Os preços das cabines foram atualizados com sucesso.",
    });
  };
  
  const handleToggleCabinAvailability = (cabinId: string, period: "morning" | "afternoon" | "evening") => {
    // In a real app, this would update the database
    toast({
      title: "Disponibilidade atualizada",
      description: `A disponibilidade da cabine foi atualizada para o período: ${
        period === "morning" ? "Manhã" : period === "afternoon" ? "Tarde" : "Noite"
      }`,
    });
  };

  if (!currentUser || userLocations.length === 0) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Portal do Franqueado</h1>
      <p className="text-muted-foreground mb-8">
        Gerencie seus locais, cabines e preços
      </p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Locais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={selectedLocation?.id}
                onValueChange={handleLocationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um local" />
                </SelectTrigger>
                <SelectContent>
                  {userLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Menu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Button
                variant={activeTab === "locations" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("locations")}
              >
                <Building className="mr-2 h-4 w-4" />
                Visão geral
              </Button>
              <Button
                variant={activeTab === "pricing" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("pricing")}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Preços
              </Button>
              <Button
                variant={activeTab === "availability" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("availability")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Disponibilidade
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "locations" && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedLocation?.name}</CardTitle>
                <CardDescription>
                  {selectedLocation?.address}, {selectedLocation?.city}-{selectedLocation?.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Cabines</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{locationCabins.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Reservas Hoje</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">0</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Receita (Mês)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">R$ 0</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "pricing" && (
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Preços - {selectedLocation?.name}</CardTitle>
                <CardDescription>
                  Defina os preços das cabines para aluguel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locationCabins.map((cabin) => (
                    <div key={cabin.id} className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor={`price-${cabin.id}`}>{cabin.name}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">R$</span>
                          <Input
                            id={`price-${cabin.id}`}
                            type="number"
                            value={cabinPrice[cabin.id] || ""}
                            onChange={(e) => handlePriceChange(cabin.id, e.target.value)}
                            className="max-w-[100px]"
                          />
                          <span className="text-muted-foreground">por período</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePricing}>Salvar Preços</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "availability" && (
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Disponibilidade - {selectedLocation?.name}</CardTitle>
                <CardDescription>
                  Defina a disponibilidade das cabines por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Cabine</th>
                      <th className="text-center">Manhã</th>
                      <th className="text-center">Tarde</th>
                      <th className="text-center">Noite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationCabins.map((cabin) => (
                      <tr key={cabin.id} className="border-t">
                        <td className="py-3">{cabin.name}</td>
                        <td className="text-center">
                          <Button
                            variant={cabin.availability.morning ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleCabinAvailability(cabin.id, "morning")}
                          >
                            {cabin.availability.morning ? "Disponível" : "Indisponível"}
                          </Button>
                        </td>
                        <td className="text-center">
                          <Button
                            variant={cabin.availability.afternoon ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleCabinAvailability(cabin.id, "afternoon")}
                          >
                            {cabin.availability.afternoon ? "Disponível" : "Indisponível"}
                          </Button>
                        </td>
                        <td className="text-center">
                          <Button
                            variant={cabin.availability.evening ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleToggleCabinAvailability(cabin.id, "evening")}
                          >
                            {cabin.availability.evening ? "Disponível" : "Indisponível"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              <CardFooter>
                <Button>Salvar Disponibilidade</Button>
              </CardFooter>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações - {selectedLocation?.name}</CardTitle>
                <CardDescription>
                  Gerencie as configurações do seu estabelecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location-name">Nome do Local</Label>
                    <Input id="location-name" defaultValue={selectedLocation?.name} />
                  </div>
                  <div>
                    <Label htmlFor="location-address">Endereço</Label>
                    <Input id="location-address" defaultValue={selectedLocation?.address} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="opening-time">Horário de Abertura</Label>
                      <Input id="opening-time" defaultValue={selectedLocation?.openingHours.open} />
                    </div>
                    <div>
                      <Label htmlFor="closing-time">Horário de Fechamento</Label>
                      <Input id="closing-time" defaultValue={selectedLocation?.openingHours.close} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Salvar Configurações</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
