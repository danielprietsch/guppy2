
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
import { toast } from "@/hooks/use-toast";
import { Location, Cabin, PREDEFINED_EQUIPMENT } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  
  const handleToggleEquipment = (cabinId: string, equipmentName: string, isChecked: boolean) => {
    setCabinEquipment(prev => {
      const cabinItems = [...(prev[cabinId] || [])];
      
      if (isChecked) {
        // Add equipment if not already in array
        if (!cabinItems.includes(equipmentName)) {
          cabinItems.push(equipmentName);
        }
      } else {
        // Remove equipment
        const index = cabinItems.indexOf(equipmentName);
        if (index !== -1) {
          cabinItems.splice(index, 1);
        }
      }
      
      return {
        ...prev,
        [cabinId]: cabinItems
      };
    });
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
          Selecione os equipamentos disponíveis em cada cabine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {locationCabins.map((cabin) => (
            <div key={cabin.id} className="border-b pb-6 last:border-b-0 last:pb-0">
              <h3 className="font-medium text-lg mb-4">{cabin.name}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PREDEFINED_EQUIPMENT.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2 rounded-md border p-3">
                    <Checkbox 
                      id={`equipment-${cabin.id}-${item.id}`}
                      checked={(cabinEquipment[cabin.id] || []).includes(item.name)}
                      onCheckedChange={(checked) => 
                        handleToggleEquipment(cabin.id, item.name, checked === true)
                      }
                    />
                    <div>
                      <Label 
                        htmlFor={`equipment-${cabin.id}-${item.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {item.name}
                      </Label>
                      {item.description && (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                ))}
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
