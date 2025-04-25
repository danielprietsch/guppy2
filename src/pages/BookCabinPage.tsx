
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
import { TermsOfUseModal } from "@/components/booking/TermsOfUseModal";

const BookCabinPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { cabinDetails, locationDetails } = location.state || {};
  const [cabin, setCabin] = useState<Cabin | null>(cabinDetails || null);
  const [locationData, setLocationData] = useState<Location | null>(locationDetails || null);
  const [loading, setLoading] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const { cabins, isLoading, searchTerm, setSearchTerm } = useCabinSearch(locationData?.id);

  const [selectedTurns, setSelectedTurns] = useState<{ [date: string]: string[] }>({});
  const [total, setTotal] = useState(0);
  const [subtotalTurns, setSubtotalTurns] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);

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

    let calculatedSubtotal = 0;
    Object.entries(selectedTurns).forEach(([date, turns]) => {
      turns.forEach(turn => {
        const turnPrice = cabin.pricing?.defaultPricing?.[turn] || cabin.price || 50;
        calculatedSubtotal += turnPrice;
      });
    });
    
    setSubtotalTurns(calculatedSubtotal);
    const calculatedServiceFee = Object.keys(selectedTurns).length > 0 ? calculatedSubtotal * 0.1 : 0;
    setServiceFee(calculatedServiceFee);
    setTotal(calculatedSubtotal + calculatedServiceFee);
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
        <h2 className="text-2xl font-bold mb-4">Espaço de Trabalho não encontrado</h2>
        <Button onClick={() => navigate("/locations")}>
          Voltar para Locais
        </Button>
      </div>
    );
  }

  return (
    <div className="container h-screen max-h-screen overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 h-full p-4">
        <div className="space-y-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-2">
            {cabin ? `Reservar ${cabin.name}` : 'Reservar Espaço de Trabalho'}
          </h1>
          
          <div className="relative max-w-md mb-4">
            <Input
              type="text"
              placeholder="Buscar espaços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p>Carregando espaços...</p>
            ) : cabins.length > 0 ? (
              cabins.map((cabin) => (
                <Card key={cabin.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{cabin.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{cabin.description}</p>
                    {cabin.equipment && cabin.equipment.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {cabin.equipment.slice(0, 3).map((item, index) => (
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
                      Selecionar Espaço
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p>Nenhum espaço encontrado.</p>
            )}
          </div>

          {cabin && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Selecione os turnos desejados</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Resumo da reserva</h2>
              {cabin && (
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">{cabin.name}</span>
                  {locationData && <span>{locationData.name}</span>}
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Turnos selecionados:</h3>
                {Object.entries(selectedTurns).map(([date, turns]) => (
                  <div key={date} className="mb-2">
                    <p className="text-sm text-gray-600">{date}:</p>
                    <div className="flex flex-wrap gap-2">
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
                <div className="space-y-2 mb-4">
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
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Valor total da reserva de Turnos no espaço</span>
                  <span>R$ {subtotalTurns.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Taxa de serviço (10%)</span>
                  <span>R$ {serviceFee.toFixed(2).replace('.', ',')}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  className="w-full" 
                  onClick={handleBookCabin}
                  disabled={!acceptTerms || Object.keys(selectedTurns).length === 0}
                >
                  Reservar Espaço
                </Button>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    className="h-4 w-4" 
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  <label htmlFor="terms" className="text-sm">
                    Li e aceito os{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium"
                      onClick={() => setIsTermsModalOpen(true)}
                    >
                      termos de uso
                    </button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TermsOfUseModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />
    </div>
  );
};

export default BookCabinPage;
