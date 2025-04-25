import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Cabin, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCabinSearch } from "@/hooks/useCabinSearch";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import BookingCalendar from "@/components/booking/BookingCalendar";

const BookCabinPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { cabinDetails, locationDetails } = location.state || {};
  const [cabin, setCabin] = useState<Cabin | null>(cabinDetails || null);
  const [locationData, setLocationData] = useState<Location | null>(locationDetails || null);
  const [loading, setLoading] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { cabins, isLoading, searchTerm, setSearchTerm } = useCabinSearch(locationData?.id);

  const [selectedTurns, setSelectedTurns] = useState<{ [date: string]: string[] }>({});
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadCabinData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        if (!cabinDetails) {
          const { data: cabinData, error: cabinError } = await supabase
            .from('cabins')
            .select('*')
            .eq('id', id)
            .single();

          if (cabinError) throw cabinError;
          
          let availability = { morning: true, afternoon: true, evening: true };
          if (cabinData.availability && typeof cabinData.availability === 'object') {
            const availObj = cabinData.availability as Record<string, any>;
            availability = {
              morning: availObj.morning === true,
              afternoon: availObj.afternoon === true,
              evening: availObj.evening === true
            };
          }

          let pricing = { defaultPricing: {}, specificDates: {} };
          let price = 50;
          if (cabinData.pricing && typeof cabinData.pricing === 'object') {
            const pricingObj = cabinData.pricing as Record<string, any>;
            pricing = {
              defaultPricing: pricingObj.defaultPricing || {},
              specificDates: pricingObj.specificDates || {}
            };
            price = pricingObj.defaultPrice || 50;
          }
          
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

          if (cabinData?.location_id) {
            const { data: locData, error: locError } = await supabase
              .from('locations')
              .select('*')
              .eq('id', cabinData.location_id)
              .single();

            if (locError) throw locError;
            
            let openingHours = { open: "09:00", close: "18:00" };
            if (locData.opening_hours && typeof locData.opening_hours === 'object') {
              const hoursObj = locData.opening_hours as Record<string, any>;
              openingHours = {
                open: hoursObj.open || "09:00",
                close: hoursObj.close || "18:00"
              };
            }
            
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

  const handleTurnSelection = (date: string, turn: string) => {
    setSelectedTurns(prev => {
      const newTurns = { ...prev };
      
      if (newTurns[date]?.includes(turn)) {
        newTurns[date] = newTurns[date].filter(t => t !== turn);
        if (newTurns[date].length === 0) {
          delete newTurns[date];
        }
      } else {
        if (!newTurns[date]) {
          newTurns[date] = [];
        }
        newTurns[date] = [...newTurns[date], turn];
      }
      
      return newTurns;
    });
  };

  useEffect(() => {
    if (!cabin) return;

    let subtotalTurns = 0;
    Object.entries(selectedTurns).forEach(([date, turns]) => {
      turns.forEach(turn => {
        const turnPrice = cabin.pricing?.defaultPricing?.[turn] || cabin.price || 50;
        subtotalTurns += turnPrice;
      });
    });
    
    const serviceFee = Object.keys(selectedTurns).length > 0 ? subtotalTurns * 0.1 : 0;
    setTotal(subtotalTurns + serviceFee);
  }, [selectedTurns, cabin]);

  const handleBookCabin = () => {
    if (!cabin || Object.keys(selectedTurns).length === 0 || !acceptTerms) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um turno e aceite os termos",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Reserva solicitada",
      description: "Sua reserva foi enviada com sucesso e está sendo processada.",
    });
    
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
          {cabin ? `Reservar ${cabin.name}` : 'Reserva de Cabine'}
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
        <Card>
          <CardHeader>
            <CardTitle>Selecione os turnos desejados</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {cabin && (
              <BookingCalendar
                selectedTurns={selectedTurns}
                onSelectTurn={handleTurnSelection}
                pricePerTurn={{
                  morning: cabin.price,
                  afternoon: cabin.price,
                  evening: cabin.price
                }}
                cabinAvailability={cabin.availability}
                cabinCreatedAt={cabin.created_at}
              />
            )}
          </CardContent>
        </Card>

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
                  <h3 className="font-medium mb-2">Turnos selecionados:</h3>
                  {Object.entries(selectedTurns).map(([date, turns]) => (
                    <div key={date} className="mb-2">
                      <p className="text-sm text-gray-600">{date}:</p>
                      <div className="flex gap-2">
                        {turns.map(turn => (
                          <span key={turn} className="text-sm bg-secondary px-2 py-1 rounded">
                            {turn === "morning" ? "Manhã" : turn === "afternoon" ? "Tarde" : "Noite"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                {cabin && cabin.equipment && (
                  <div className="space-y-2">
                    <h3 className="font-medium">O que está incluso:</h3>
                    <ul className="grid gap-1 text-sm">
                      {cabin.equipment.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span>•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Separator className="my-4" />
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Valor total da reserva de Turnos no espaço</span>
                    <span>R$ {(total * 0.9).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Taxa de serviço (10%)</span>
                    <span>R$ {(total * 0.1).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button 
                className="w-full" 
                onClick={handleBookCabin}
                disabled={!acceptTerms || Object.keys(selectedTurns).length === 0}
              >
                Reservar Cabine
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

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
  );
};

export default BookCabinPage;
