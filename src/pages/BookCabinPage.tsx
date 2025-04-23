
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Cabin, Location } from "@/lib/types";
import { cabins, locations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Check } from "lucide-react";

const BookCabinPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "evening" | null>(null);
  const [isWeekend, setIsWeekend] = useState<boolean>(false);
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (id) {
      const foundCabin = cabins.find((cabin) => cabin.id === id);
      setCabin(foundCabin || null);
      
      if (foundCabin) {
        const foundLocation = locations.find((loc) => loc.id === foundCabin.locationId);
        setLocation(foundLocation || null);
      }
    }
  }, [id]);

  useEffect(() => {
    if (date) {
      const day = date.getDay();
      const isWeekend = day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
      setIsWeekend(isWeekend);
      setPrice(isWeekend ? 150 : 100);
    }
  }, [date]);

  const handleBookCabin = () => {
    // In a real application, this would make an API call to book the cabin
    const currentUser = localStorage.getItem("currentUser");
    
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer uma reserva.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    if (!date || !selectedShift) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data e um turno.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulate a successful booking
    toast({
      title: "Reserva realizada com sucesso!",
      description: `Você reservou a cabine para ${format(date, "dd 'de' MMMM", { locale: ptBR })} no turno da ${
        selectedShift === "morning" ? "manhã" : selectedShift === "afternoon" ? "tarde" : "noite"
      }.`,
    });
    
    // In a real application, we would navigate to a confirmation page
    // For this mock version, we'll navigate to the provider dashboard
    navigate("/provider/dashboard");
  };

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
                  disabled={!cabin.availability.morning}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Manhã</span>
                  <span className="text-xs mt-1">08:00 - 12:00</span>
                </Button>
                <Button
                  variant={selectedShift === "afternoon" ? "default" : "outline"}
                  onClick={() => setSelectedShift("afternoon")}
                  disabled={!cabin.availability.afternoon}
                  className="flex flex-col h-auto py-3"
                >
                  <span>Tarde</span>
                  <span className="text-xs mt-1">13:00 - 17:00</span>
                </Button>
                <Button
                  variant={selectedShift === "evening" ? "default" : "outline"}
                  onClick={() => setSelectedShift("evening")}
                  disabled={!cabin.availability.evening}
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
              <input type="checkbox" id="terms" className="h-4 w-4" />
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
                  <span className="font-medium">{cabin.name}</span>
                  <span>{location.name}</span>
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
              <Button className="w-full" onClick={handleBookCabin}>
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
