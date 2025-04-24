
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Location, Cabin } from "@/lib/types";

interface AvailabilitySettingsProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const AvailabilitySettings = ({ 
  selectedLocation, 
  locationCabins 
}: AvailabilitySettingsProps) => {
  const handleToggleCabinAvailability = (cabinId: string, period: "morning" | "afternoon" | "evening") => {
    toast({
      title: "Disponibilidade atualizada",
      description: `A disponibilidade da cabine foi atualizada para o período: ${
        period === "morning" ? "Manhã" : period === "afternoon" ? "Tarde" : "Noite"
      }`,
    });
  };

  const handleSaveAvailability = () => {
    toast({
      title: "Disponibilidade salva",
      description: "A disponibilidade das cabines foi atualizada com sucesso.",
    });
  };

  return (
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
        <Button onClick={handleSaveAvailability}>Salvar Disponibilidade</Button>
      </CardFooter>
    </Card>
  );
};
