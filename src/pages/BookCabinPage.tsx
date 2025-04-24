
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Cabin, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";
import { translateSupabaseError } from "@/utils/supabaseErrorTranslations";

const BookCabinPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "evening" | null>(null);
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(0);
  const [acceptTerms, setAcceptTerms] = useState<boolean>(false);

  useEffect(() => {
    const fetchCabinData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        debugLog(`BookCabinPage: Fetching cabin with id ${id}`);
        
        const { data: cabinData, error: cabinError } = await supabase
          .from('cabins')
          .select('*')
          .eq('id', id)
          .single();

        if (cabinError) {
          debugError("BookCabinPage: Error fetching cabin:", cabinError);
          setLoading(false);
          return;
        }

        if (!cabinData) {
          debugLog("BookCabinPage: No cabin found with id:", id);
          setLoading(false);
          return;
        }

        const transformedCabin = transformCabinData(cabinData);
        setCabin(transformedCabin);

        if (cabinData.location_id) {
          const { data: locationData, error: locationError } = await supabase
            .from('locations')
            .select('*')
            .eq('id', cabinData.location_id)
            .single();

          if (locationError) {
            debugError("BookCabinPage: Error fetching location:", locationError);
          } else if (locationData) {
            const transformedLocation = transformLocationData(locationData);
            setLocation(transformedLocation);
          }
        }
      } catch (error) {
        debugError("BookCabinPage: Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCabinData();
  }, [id]);

  const transformCabinData = (cabinData: any): Cabin => {
    let availability = { morning: true, afternoon: true, evening: true };
    
    try {
      if (cabinData.availability) {
        if (typeof cabinData.availability === 'string') {
          availability = JSON.parse(cabinData.availability);
        } else if (typeof cabinData.availability === 'object' && cabinData.availability !== null) {
          const avail = cabinData.availability as any;
          availability = {
            morning: avail.morning !== false,
            afternoon: avail.afternoon !== false,
            evening: avail.evening !== false
          };
        }
      }
    } catch (e) {
      debugError("BookCabinPage: Error parsing availability data", e);
    }
    
    let pricingObject = {
      defaultPricing: {},
      specificDates: {}
    };
    
    try {
      if (cabinData.pricing) {
        if (typeof cabinData.pricing === 'string') {
          const parsedPricing = JSON.parse(cabinData.pricing);
          if (parsedPricing && typeof parsedPricing === 'object') {
            pricingObject = {
              defaultPricing: parsedPricing.defaultPricing || {},
              specificDates: parsedPricing.specificDates || {}
            };
          }
        } else if (typeof cabinData.pricing === 'object' && cabinData.pricing !== null) {
          const pricingData = cabinData.pricing as any;
          pricingObject = {
            defaultPricing: pricingData.defaultPricing || {},
            specificDates: pricingData.specificDates || {}
          };
        }
      }
    } catch (e) {
      debugError("BookCabinPage: Error parsing pricing data", e);
    }

    let cabinPrice = 0;
    try {
      if (pricingObject.defaultPricing && 
          typeof pricingObject.defaultPricing === 'object' && 
          pricingObject.defaultPricing !== null) {
            
        const defaultPricing = pricingObject.defaultPricing as any;
        
        if (defaultPricing.weekday && typeof defaultPricing.weekday === 'number') {
          cabinPrice = defaultPricing.weekday;
        } else if (defaultPricing.weekend && typeof defaultPricing.weekend === 'number') {
          cabinPrice = defaultPricing.weekend;
        }
      }
    } catch (e) {
      debugError("BookCabinPage: Error extracting cabin price", e);
    }

    return {
      id: cabinData.id,
      locationId: cabinData.location_id,
      name: cabinData.name,
      description: cabinData.description || "",
      equipment: cabinData.equipment || [],
      imageUrl: cabinData.image_url || "",
      availability: availability,
      price: cabinPrice,
      pricing: pricingObject
    };
  };

  const transformLocationData = (locationData: any): Location => {
    let openingHours = { open: "09:00", close: "18:00" };
    
    if (locationData.opening_hours) {
      try {
        if (typeof locationData.opening_hours === 'string') {
          const parsed = JSON.parse(locationData.opening_hours);
          if (parsed && typeof parsed === 'object' && 'open' in parsed && 'close' in parsed) {
            openingHours = {
              open: String(parsed.open),
              close: String(parsed.close)
            };
          }
        } else if (typeof locationData.opening_hours === 'object' && locationData.opening_hours !== null) {
          const hours = locationData.opening_hours as any;
          if ('open' in hours && 'close' in hours) {
            openingHours = {
              open: String(hours.open),
              close: String(hours.close)
            };
          }
        }
      } catch (e) {
        debugError("BookCabinPage: Error parsing opening hours", e);
      }
    }
    
    return {
      id: locationData.id,
      name: locationData.name,
      address: locationData.address,
      city: locationData.city,
      state: locationData.state,
      zipCode: locationData.zip_code,
      cabinsCount: locationData.cabins_count || 0,
      openingHours: openingHours,
      amenities: locationData.amenities || [],
      imageUrl: locationData.image_url || "",
      description: locationData.description || "",
      active: locationData.active
    };
  };

  useEffect(() => {
    if (date && cabin) {
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6;
      setIsWeekend(isWeekend);
      
      let newPrice = 0;
      
      if (cabin.pricing && typeof cabin.pricing === 'object') {
        const pricing = cabin.pricing as any;
        const defaultPricing = pricing.defaultPricing || {};
        
        if (isWeekend && defaultPricing.weekend) {
          newPrice = Number(defaultPricing.weekend);
        } else if (!isWeekend && defaultPricing.weekday) {
          newPrice = Number(defaultPricing.weekday);
        }
      }
      
      if (newPrice === 0) {
        newPrice = isWeekend ? 150 : 100;
      }
      
      setPrice(newPrice);
    }
  }, [date, cabin]);

  const handleBookCabin = async () => {
    try {
      setBookingLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para fazer uma reserva.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      
      if (!date || !selectedShift || !cabin) {
        toast({
          title: "Erro",
          description: "Por favor, selecione uma data e um turno.",
          variant: "destructive",
        });
        return;
      }
      
      if (!acceptTerms) {
        toast({
          title: "Erro",
          description: "Você precisa aceitar os termos de uso.",
          variant: "destructive",
        });
        return;
      }

      // Fix: Use a type assertion to call the function regardless of TypeScript's type checking
      const { data: bookingId, error } = await supabase.functions.invoke('create-booking', {
        body: {
          cabinId: cabin.id,
          professionalId: session.user.id,
          date: format(date, 'yyyy-MM-dd'),
          shift: selectedShift,
          price: price,
          status: 'confirmed'
        }
      });

      if (error) {
        debugError('Error creating booking:', error);
        let errorMessage = "Ocorreu um erro ao processar sua reserva. Tente novamente.";
        
        if (error.message) {
          errorMessage = translateSupabaseError(error.message);
        }
        
        toast({
          title: "Erro ao fazer reserva",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Reserva realizada com sucesso!",
        description: `Você reservou a cabine para ${format(date, "dd 'de' MMMM", { locale: ptBR })} no turno da ${
          selectedShift === "morning" ? "manhã" : selectedShift === "afternoon" ? "tarde" : "noite"
        }.`,
      });
      
      navigate("/client/reservations");
    } catch (error) {
      console.error('Error in handleBookCabin:', error);
      toast({
        title: "Erro ao fazer reserva",
        description: "Ocorreu um erro ao processar sua reserva. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <p className="text-lg">Carregando dados da cabine...</p>
      </div>
    );
  }

  if (!cabin || !location) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <h2>Cabine não encontrada</h2>
        <Button className="mt-4" onClick={() => navigate("/locations")}>
          Voltar para Locais
        </Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-3xl font-bold">Reserva de Cabine</h1>
      
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
                  disabled={!cabin?.availability.morning}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Manhã</span>
                  <span className="text-xs mt-1">08:00 - 12:00</span>
                </Button>
                <Button
                  variant={selectedShift === "afternoon" ? "default" : "outline"}
                  onClick={() => setSelectedShift("afternoon")}
                  disabled={!cabin?.availability.afternoon}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Tarde</span>
                  <span className="text-xs mt-1">13:00 - 17:00</span>
                </Button>
                <Button
                  variant={selectedShift === "evening" ? "default" : "outline"}
                  onClick={() => setSelectedShift("evening")}
                  disabled={!cabin?.availability.evening}
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
                <div className="flex items-center justify-between">
                  <span className="font-medium">{cabin?.name}</span>
                  <span>{location?.name}</span>
                </div>
                
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
                
                {cabin?.equipment && cabin.equipment.length > 0 && (
                  <>
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
                    <Separator className="my-4" />
                  </>
                )}
                
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
                disabled={!acceptTerms || !selectedShift || !date || bookingLoading}
              >
                {bookingLoading ? "Processando..." : "Reservar Cabine"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookCabinPage;
