
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Location } from "@/lib/types";

interface LocationSettingsProps {
  selectedLocation: Location | null;
}

export const LocationSettings = ({ selectedLocation }: LocationSettingsProps) => {
  const handleSaveSettings = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações do local foram atualizadas com sucesso."
    });
  };

  return (
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
          <div>
            <Label htmlFor="location-description">Descrição</Label>
            <Textarea 
              id="location-description" 
              defaultValue={selectedLocation?.description} 
              placeholder="Descreva seu estabelecimento"
              className="min-h-[100px]"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings}>Salvar Configurações</Button>
      </CardFooter>
    </Card>
  );
};
