
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Location, Cabin } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Search, MapPin, SlidersHorizontal } from "lucide-react";
import CabinCard from "@/components/CabinCard";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  search: z.string().optional(),
  location: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Define an extended cabin type that includes city and state for filtering purposes
interface CabinWithLocation extends Cabin {
  city?: string;
  state?: string;
}

const CabinSearchPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [cabins, setCabins] = useState<CabinWithLocation[]>([]);
  const [filteredCabins, setFilteredCabins] = useState<CabinWithLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      search: "",
      location: "",
      priceMin: "",
      priceMax: "",
    },
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Check if user is professional
        const userType = session.user.user_metadata?.userType;
        
        if (userType !== 'professional' && userType !== 'provider') {
          toast({
            title: "Acesso restrito",
            description: "Esta página é apenas para profissionais.",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        // Get user's geolocation for proximity sorting
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            () => {
              console.log("Geolocation permission denied or not available");
            }
          );
        }

        fetchLocationsAndCabins();
      } catch (error) {
        console.error("Error checking authentication:", error);
        toast({
          title: "Erro",
          description: "Erro ao verificar autenticação",
          variant: "destructive",
        });
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchLocationsAndCabins = async () => {
    setLoading(true);
    try {
      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true);

      if (locationsError) throw locationsError;

      // Transform locations
      const transformedLocations = locationsData.map((location): Location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zip_code,
        cabinsCount: location.cabins_count || 0,
        openingHours: location.opening_hours 
          ? (typeof location.opening_hours === 'string' 
              ? JSON.parse(location.opening_hours) 
              : location.opening_hours)
          : { open: "09:00", close: "18:00" },
        amenities: location.amenities || [],
        imageUrl: location.image_url || "",
        description: location.description || "",
        active: location.active,
        ownerId: location.owner_id,
      }));

      setLocations(transformedLocations);

      // Fetch all cabins
      const { data: cabinsData, error: cabinsError } = await supabase
        .from('cabins')
        .select('*, locations(city, state)');

      if (cabinsError) throw cabinsError;

      // Transform cabins
      const transformedCabins = cabinsData.map((cabin): CabinWithLocation => {
        // Parse availability or set defaults
        const availability = cabin.availability 
          ? (typeof cabin.availability === 'string' 
              ? JSON.parse(cabin.availability) 
              : cabin.availability)
          : { morning: true, afternoon: true, evening: true };

        // Parse pricing or set defaults
        const pricing = cabin.pricing 
          ? (typeof cabin.pricing === 'string' 
              ? JSON.parse(cabin.pricing) 
              : cabin.pricing)
          : { defaultPricing: {} };

        const defaultPrice = pricing.defaultPricing?.price || 0;

        return {
          id: cabin.id,
          locationId: cabin.location_id,
          name: cabin.name,
          description: cabin.description || "",
          equipment: cabin.equipment || [],
          imageUrl: cabin.image_url || "",
          availability: availability,
          price: defaultPrice,
          pricing: pricing,
          // Add location info for filtering and display
          city: cabin.locations?.city || "",
          state: cabin.locations?.state || "",
        };
      });

      // Sort cabins by proximity if user location is available
      const sortedCabins = sortCabinsByProximity(transformedCabins);
      
      setCabins(sortedCabins);
      setFilteredCabins(sortedCabins);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das cabines e localizações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sortCabinsByProximity = (cabinsToSort: CabinWithLocation[]) => {
    // If we don't have user location, just return the cabins as is
    if (!userLocation) return cabinsToSort;

    // For now, we'll just sort based on a random factor
    // In a real implementation, you would calculate actual distance
    return [...cabinsToSort].sort((a, b) => {
      // We're not actually using geolocation yet, just placeholder
      return Math.random() - 0.5;
    });
  };

  const onSubmit = (values: FormValues) => {
    let filtered = [...cabins];
    
    // Filter by search term (name or description)
    if (values.search) {
      const searchTerm = values.search.toLowerCase();
      filtered = filtered.filter(cabin => 
        cabin.name.toLowerCase().includes(searchTerm) || 
        cabin.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by location
    if (values.location) {
      filtered = filtered.filter(cabin => cabin.locationId === values.location);
    }
    
    // Filter by price range
    if (values.priceMin) {
      const minPrice = parseFloat(values.priceMin);
      filtered = filtered.filter(cabin => (cabin.price || 0) >= minPrice);
    }
    
    if (values.priceMax) {
      const maxPrice = parseFloat(values.priceMax);
      filtered = filtered.filter(cabin => (cabin.price || 0) <= maxPrice);
    }
    
    setFilteredCabins(filtered);
  };

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
          <p className="text-muted-foreground">Buscando cabines disponíveis, por favor aguarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Procurar Cabines</h1>
          <p className="mt-1 text-gray-500">
            Encontre cabines disponíveis para reservar
          </p>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 md:mt-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <FormField
                control={form.control}
                name="search"
                render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <FormControl>
                        <Input
                          placeholder="Pesquisar cabines por nome ou descrição..."
                          className="pl-10"
                          {...field}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit">Buscar</Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma localização" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Todas as localizações</SelectItem>
                            {locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name} - {location.city}, {location.state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priceMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Mínimo (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="10"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priceMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Máximo (R$)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            min="0"
                            step="10"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </Form>

      <div className="mt-8">
        {filteredCabins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCabins.map((cabin) => {
              const location = locations.find((loc) => loc.id === cabin.locationId);
              return (
                <CabinCard 
                  key={cabin.id} 
                  cabin={cabin} 
                  location={location}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">Nenhuma cabine encontrada</h3>
            <p className="text-muted-foreground mt-2">
              Tente ajustar seus filtros ou faça uma pesquisa diferente
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinSearchPage;
