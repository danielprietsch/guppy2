
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { EquipmentCheckboxProps } from "./types";

export const EquipmentCheckbox: React.FC<EquipmentCheckboxProps> = ({
  equipment,
  item,
  onToggle,
}) => {
  return (
    <div className="flex items-center space-x-2 rounded-md border p-3">
      <Checkbox 
        id={`equipment-${item.id}`}
        checked={equipment.includes(item.name)}
        onCheckedChange={(checked) => onToggle(item.name, checked === true)}
      />
      <div>
        <Label 
          htmlFor={`equipment-${item.id}`}
          className="font-medium cursor-pointer"
        >
          {item.name}
        </Label>
        {item.description && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
    </div>
  );
};
