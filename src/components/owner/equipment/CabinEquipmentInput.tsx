
import * as React from "react";
import { Label } from "@/components/ui/label";
import { PREDEFINED_EQUIPMENT } from "@/lib/types";
import { EquipmentCheckbox } from "./EquipmentCheckbox";
import type { CabinEquipmentInputProps } from "./types";

export const CabinEquipmentInput: React.FC<CabinEquipmentInputProps> = ({
  equipment,
  setEquipment
}) => {
  const handleEquipmentToggle = React.useCallback((equipmentName: string, checked: boolean) => {
    if (checked) {
      if (!equipment.includes(equipmentName)) {
        setEquipment(prev => [...prev, equipmentName]);
      }
    } else {
      setEquipment(prev => prev.filter(item => item !== equipmentName));
    }
  }, [equipment, setEquipment]);

  return (
    <div>
      <Label className="text-base font-medium mb-3 block">Equipamentos disponíveis</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PREDEFINED_EQUIPMENT.map((item) => (
          <EquipmentCheckbox
            key={item.id}
            equipment={equipment}
            item={item}
            onToggle={handleEquipmentToggle}
          />
        ))}
      </div>
    </div>
  );
};
