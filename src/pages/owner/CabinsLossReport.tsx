
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocationManagement } from "@/hooks/useLocationManagement";
import { debugAreaLog } from "@/utils/debugLogger";

export const CabinsLossReport = () => {
  const { selectedLocation, locationCabins } = useLocationManagement();
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
    debugAreaLog('REPORTS', 'Calculating cabin losses...');
    // Mock data for demonstration
    const mockLosses = locationCabins.reduce((acc, cabin) => {
      acc[cabin.id] = {
        name: cabin.name,
        lostSlots: [
          {
            date: "2025-04-24",
            turn: "morning"
          },
          {
            date: "2025-04-24",
            turn: "afternoon"
          }
        ]
      };
      return acc;
    }, {} as typeof losses);
    
    setLosses(mockLosses);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Cabines com Prejuízo - {selectedLocation?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(losses).map(([cabinId, data]) => (
              <Card key={cabinId} className="bg-background/50">
                <CardHeader>
                  <CardTitle className="text-lg">{data.name}</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CabinsLossReport;
