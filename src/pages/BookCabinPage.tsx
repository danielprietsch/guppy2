
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Cabin, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar as CalendarIcon, Check } from "lucide-react";
import { useCabinSearch } from "@/hooks/useCabinSearch";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const BookCabinPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { cabinDetails, locationDetails } = location.state || {};
  const [cabin, setCabin] = useState<Cabin | null>(cabinDetails || null);
  const [locationData, setLocationData] = useState<Location | null>(locationDetails || null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "evening" | "">("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [price, setPrice] = useState(0);
  const [isWeekend, setIsWeekend] = useState(false);

  const { cabins, isLoading, searchTerm, setSearchTerm } = useCabinSearch(locationData?.id);

  useEffect(() => {
    const loadCabinData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        // If we don't have cabin details from state, fetch them
        if (!cabinDetails) {
          const { data: cabinData, error: cabinError } = await supabase
            .from('cabins')
            .select('*')
            .eq('id', id)
            .single();

          if (cabinError) throw cabinError;
          
          // Parse the JSON data to match our Cabin type
          let availability = { morning: true, afternoon: true, evening: true };
          if (cabinData.availability && typeof cabinData.availability === 'object') {
            availability = {
              morning: cabinData.availability.morning === true,
              afternoon: cabinData.availability.afternoon === true,
              evening: cabinData.availability.evening === true
            };
          }

          let pricing = { defaultPricing: {}, specificDates: {} };
          let price = 50; // Default price
          if (cabinData.pricing && typeof cabinData.pricing === 'object') {
            pricing = {
              defaultPricing: cabinData.pricing.defaultPricing || {},
              specificDates: cabinData.pricing.specificDates || {}
            };
            price = cabinData.pricing.defaultPrice || 50;
          }
          
          // Transform the data to match our Cabin type
          const transformedCabin: Cabin = {
            id: cabinData.id,
            locationId: cabinData.location_id,
            name: cabinData.name,
            description: cabinData.description || '',
            equipment: cabinData.equipment || [],
            imageUrl: cabinData.image_url,
            availability,
            price,
            pricing
          };
          
          setCabin(transformedCabin);

          // Fetch location data if we have a cabin
          if (cabinData?.location_id) {
            const { data: locData, error: locError } = await supabase
              .from('locations')
              .select('*')
              .eq('id', cabinData.location_id)
              .single();

            if (locError) throw locError;
            
            // Parse the opening hours JSON
            let openingHours = { open: "09:00", close: "18:00" };
            if (locData.opening_hours && typeof locData.opening_hours === 'object') {
              openingHours = {
                open: locData.opening_hours.open || "09:00",
                close: locData.opening_hours.close || "18:00"
              };
            }
            
            // Transform the location data
            const transformedLocation: Location = {
              id: locData.id,
              name: locData.name,
              address: locData.address,
              city: locData.city,
              state: locData.state,
              zipCode: locData.zip_code,
              cabinsCount: locData.cabins_count || 0,
              openingHours,
              amenities: locData.amenities || [],
              imageUrl: locData.image_url,
              description: locData.description,
              ownerId: locData.owner_id,
              active: locData.active
            };
            
            setLocationData(transformedLocation);
          }
        }
      } catch (error) {
        console.error("Error loading cabin data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCabinData();
  }, [id, cabinDetails]);

  useEffect(() => {
    if (cabin && date) {
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
      setIsWeekend(isWeekend);
      
      // Set price based on cabin pricing and day
      const basePrice = cabin.price || 50;
      const weekendMultiplier = isWeekend ? 1.2 : 1;
      setPrice(basePrice * weekendMultiplier);
    }
  }, [cabin, date]);

  const handleBookCabin = () => {
    if (!cabin || !date || !selectedShift || !acceptTerms) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos e aceite os termos",
        variant: "destructive",
      });
      return;
    }

    // Logic for booking cabin would go here
    toast({
      title: "Reserva solicitada",
      description: "Sua reserva foi enviada com sucesso e está sendo processada.",
    });
    
    // Navigate to a confirmation page or dashboard
    navigate("/professional-dashboard");
  };

  if (loading) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16">
        <p className="text-center text-lg">Carregando...</p>
      </div>
    );
  }

  if (!cabin && !locationData) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Cabine não encontrada</h2>
        <Button onClick={() => navigate("/locations")}>
          Voltar para Locais
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {locationData ? `Cabines em ${locationData.name}` : 'Reserva de Cabine'}
        </h1>
        
        <div className="relative max-w-md mb-6">
          <Input
            type="text"
            placeholder="Buscar cabines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p>Carregando cabines...</p>
          ) : cabins.length > 0 ? (
            cabins.map((cabin) => (
              <Card key={cabin.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{cabin.name}</h3>
                  <p className="text-sm text-muted-foreground">{cabin.description}</p>
                  {cabin.equipment && cabin.equipment.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {cabin.equipment.map((item, index) => (
                        <li key={index} className="text-xs flex items-center gap-1">
                          <span>•</span> {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/book-cabin/${cabin.id}`, {
                      state: { cabinDetails: cabin, locationDetails: locationData }
                    })}
                  >
                    Selecionar Cabine
                  </Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <p>Nenhuma cabine encontrada.</p>
          )}
        </div>
      </div>
      
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_400px]">
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Selecione a data</h2>
              <div className="mt-4 flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border p-3 pointer-events-auto"
                  disabled={(date) => {
                    // Disable dates in the past
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </div>
              
              <h2 className="mt-8 text-xl font-semibold">Selecione o turno</h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Button
                  variant={selectedShift === "morning" ? "default" : "outline"}
                  onClick={() => setSelectedShift("morning")}
                  disabled={cabin && !cabin.availability.morning}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Manhã</span>
                  <span className="text-xs mt-1">08:00 - 12:00</span>
                </Button>
                <Button
                  variant={selectedShift === "afternoon" ? "default" : "outline"}
                  onClick={() => setSelectedShift("afternoon")}
                  disabled={cabin && !cabin.availability.afternoon}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Tarde</span>
                  <span className="text-xs mt-1">13:00 - 17:00</span>
                </Button>
                <Button
                  variant={selectedShift === "evening" ? "default" : "outline"}
                  onClick={() => setSelectedShift("evening")}
                  disabled={cabin && !cabin.availability.evening}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Noite</span>
                  <span className="text-xs mt-1">18:00 - 22:00</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h2 className="text-xl font-semibold">Termos de Uso</h2>
            <div className="mt-4 max-h-64 overflow-y-auto rounded-md border p-4">
              <h3 className="font-medium">CONTRATO DE LOCAÇÃO TEMPORÁRIA DE CABINES</h3>
              <p className="mt-2 text-sm">
                Pelo presente instrumento particular, de um lado GUPPY LTDA, doravante denominado LOCADOR, 
                e de outro lado o usuário devidamente cadastrado na plataforma, doravante denominado 
                simplesmente LOCATÁRIO, têm entre si como justo e contratado o que segue:
              </p>
              <p className="mt-2 text-sm">
                1. O LOCADOR, por este instrumento, dá em locação ao LOCATÁRIO uma CABINE de sua propriedade,
                destinada a prestação de serviços de beleza, em posição e local ajustável, no prazo definido no ato da reserva.
              </p>
              <p className="mt-2 text-sm">
                2. O aluguel será pago de forma antecipada, no valor correspondente ao turno e dia da semana escolhidos.
              </p>
              <p className="mt-2 text-sm">
                3. O LOCATÁRIO será responsável por zelar pela limpeza e conservação do espaço e equipamentos.
              </p>
              <p className="mt-2 text-sm">
                4. Políticas de cancelamento: cancelamentos com 24h de antecedência recebem reembolso integral. 
                Cancelamentos com menos de 24h recebem 50% de reembolso.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="h-4 w-4" 
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <label htmlFor="terms" className="text-sm">
                Li e aceito os termos de uso
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold">Resumo da reserva</h2>
              <div className="mt-4">
                {cabin && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cabin.name}</span>
                    {locationData && <span>{locationData.name}</span>}
                  </div>
                )}
                
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <span>
                      {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span>
                      Turno: {selectedShift === "morning" ? "Manhã (08:00 - 12:00)" : selectedShift === "afternoon" ? "Tarde (13:00 - 17:00)" : selectedShift === "evening" ? "Noite (18:00 - 22:00)" : "Selecione um turno"}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {cabin && cabin.equipment && (
                  <div className="space-y-2">
                    <h3 className="font-medium">O que está incluso:</h3>
                    <ul className="grid gap-1 text-sm">
                      {cabin.equipment.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Valor do turno ({isWeekend ? "fim de semana" : "dia de semana"})</span>
                    <span>R$ {price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taxa de serviço</span>
                    <span>R$ 10,00</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>R$ {(price + 10).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button 
                className="w-full" 
                onClick={handleBookCabin}
                disabled={!acceptTerms || !selectedShift || !date}
              >
                Reservar Cabine
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookCabinPage;
