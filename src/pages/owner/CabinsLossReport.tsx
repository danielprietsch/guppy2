
import { useState, useEffect } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocationManagement } from "@/hooks/useLocationManagement";
import { debugAreaLog } from "@/utils/debugLogger";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const CabinsLossReport = () => {
  const { selectedLocation, locationCabins } = useLocationManagement();
  const [isLoading, setIsLoading] = useState(false);
  const [losses, setLosses] = useState<{
    [cabinId: string]: {
      name: string;
      lostSlots: {
        date: string;
        turn: string;
      }[];
    };
  }>({});

  // This would typically come from your backend
  const calculateLosses = () => {
    debugAreaLog('PRICE_EDIT', 'Calculating cabin losses...');
    setIsLoading(true);
    
    try {
      // Mock data for demonstration
      const mockLosses = locationCabins.reduce((acc, cabin) => {
        // Use cabin creation date as first day
        const creationDate = cabin.created_at ? new Date(cabin.created_at) : subDays(new Date(), 7);
        const yesterday = subDays(new Date(), 1);
        
        // Generate lost slots between creation date and yesterday
        const lostSlots = [];
        let currentDate = new Date(creationDate);
        
        while (currentDate <= yesterday) {
          // For demonstration, add some random lost slots
          if (Math.random() > 0.7) {
            const turns = ["morning", "afternoon", "evening"];
            const randomTurn = turns[Math.floor(Math.random() * turns.length)];
            
            lostSlots.push({
              date: format(currentDate, 'yyyy-MM-dd'),
              turn: randomTurn
            });
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        acc[cabin.id] = {
          name: cabin.name,
          lostSlots: lostSlots
        };
        return acc;
      }, {} as typeof losses);
      
      setLosses(mockLosses);
      toast({
        title: "Relatório gerado com sucesso",
        description: "Os dados de prejuízo das cabines foram calculados."
      });
    } catch (error) {
      console.error("Error calculating losses:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um problema ao calcular os prejuízos das cabines.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Relatório de Cabines com Prejuízo - {selectedLocation?.name}</CardTitle>
          <Button 
            onClick={calculateLosses}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              'Gerar Relatório'
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {!Object.keys(losses).length ? (
            <div className="text-center py-8 text-muted-foreground">
              Clique em "Gerar Relatório" para calcular os prejuízos das cabines.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(losses).map(([cabinId, data]) => (
                <Card key={cabinId} className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{data.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.lostSlots.length === 0 ? (
                      <div className="p-2 bg-green-50 text-green-700 rounded-md">
                        Nenhum prejuízo registrado para esta cabine.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.lostSlots.map((slot, index) => (
                          <div 
                            key={`${slot.date}-${slot.turn}-${index}`}
                            className="p-2 bg-red-50 text-red-700 rounded-md"
                          >
                            {format(new Date(slot.date), "dd 'de' MMMM", { locale: ptBR })} - {
                              slot.turn === "morning" ? "Manhã" :
                              slot.turn === "afternoon" ? "Tarde" : "Noite"
                            }
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CabinsLossReport;
