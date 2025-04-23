
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PREDEFINED_EQUIPMENT } from "@/lib/types";

interface CabinEquipmentInputProps {
  equipment: string[];
  setEquipment: React.Dispatch<React.SetStateAction<string[]>>;
}

export const CabinEquipmentInput: React.FC<CabinEquipmentInputProps> = ({
  equipment,
  setEquipment
}) => {
  const handleEquipmentToggle = (equipmentName: string, checked: boolean) => {
    if (checked) {
      // Add equipment if checked and not already in the array
      if (!equipment.includes(equipmentName)) {
        setEquipment([...equipment, equipmentName]);
      }
    } else {
      // Remove equipment if unchecked
      setEquipment(equipment.filter(item => item !== equipmentName));
    }
  };

  return (
    <div>
      <Label className="text-base font-medium mb-3 block">Equipamentos disponíveis</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PREDEFINED_EQUIPMENT.map((item) => (
          <div key={item.id} className="flex items-center space-x-2 rounded-md border p-3">
            <Checkbox 
              id={`equipment-${item.id}`}
              checked={equipment.includes(item.name)}
              onCheckedChange={(checked) => handleEquipmentToggle(item.name, checked === true)}
            />
            <div>
              <Label htmlFor={`equipment-${item.id}`} className="font-medium cursor-pointer">
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
  );
};
