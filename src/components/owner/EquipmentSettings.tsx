
import { useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { Location, Cabin } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

interface EquipmentSettingsProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const EquipmentSettings = ({
  selectedLocation, 
  locationCabins 
}: EquipmentSettingsProps) => {
  const [cabinEquipment, setCabinEquipment] = useState<Record<string, string[]>>(() => {
    const initialEquipment: Record<string, string[]> = {};
    locationCabins.forEach((cabin) => {
      initialEquipment[cabin.id] = cabin.equipment || [];
    });
    return initialEquipment;
  });
  
  const [newEquipment, setNewEquipment] = useState<Record<string, string>>(() => {
    const initialNewEquipment: Record<string, string> = {};
    locationCabins.forEach((cabin) => {
      initialNewEquipment[cabin.id] = "";
    });
    return initialNewEquipment;
  });

  const handleNewEquipmentChange = (cabinId: string, value: string) => {
    setNewEquipment((prev) => ({
      ...prev,
      [cabinId]: value,
    }));
  };
  
  const handleAddEquipment = (cabinId: string) => {
    const equipmentToAdd = newEquipment[cabinId]?.trim();
    
    if (!equipmentToAdd) {
      toast({
        title: "Campo vazio",
        description: "Por favor, insira o nome do equipamento.",
        variant: "destructive",
      });
      return;
    }
    
    setCabinEquipment((prev) => ({
      ...prev,
      [cabinId]: [...(prev[cabinId] || []), equipmentToAdd],
    }));
    
    setNewEquipment((prev) => ({
      ...prev,
      [cabinId]: "",
    }));
  };
  
  const handleRemoveEquipment = (cabinId: string, indexToRemove: number) => {
    setCabinEquipment((prev) => ({
      ...prev,
      [cabinId]: (prev[cabinId] || []).filter((_, index) => index !== indexToRemove),
    }));
  };
  
  const handleSaveEquipment = () => {
    toast({
      title: "Equipamentos atualizados",
      description: "Os equipamentos das cabines foram atualizados com sucesso.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipamentos das Cabines - {selectedLocation?.name}</CardTitle>
        <CardDescription>
          Cadastre os equipamentos disponíveis em cada cabine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {locationCabins.map((cabin) => (
            <div key={cabin.id} className="border-b pb-6 last:border-b-0 last:pb-0">
              <h3 className="font-medium text-lg mb-2">{cabin.name}</h3>
              
              <div className="mb-4">
                <Label htmlFor={`equipment-list-${cabin.id}`}>Equipamentos Cadastrados</Label>
                {cabinEquipment[cabin.id]?.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {cabinEquipment[cabin.id].map((equipment, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span>{equipment}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEquipment(cabin.id, index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    Nenhum equipamento cadastrado.
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor={`new-equipment-${cabin.id}`}>Adicionar Equipamento</Label>
                  <Input
                    id={`new-equipment-${cabin.id}`}
                    value={newEquipment[cabin.id] || ""}
                    onChange={(e) => handleNewEquipmentChange(cabin.id, e.target.value)}
                    placeholder="Nome do equipamento"
                  />
                </div>
                <Button 
                  className="mt-auto"
                  onClick={() => handleAddEquipment(cabin.id)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveEquipment}>Salvar Equipamentos</Button>
      </CardFooter>
    </Card>
  );
};
