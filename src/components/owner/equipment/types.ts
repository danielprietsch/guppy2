
import { SystemEquipment } from "@/lib/types";

export interface EquipmentCheckboxProps {
  equipment: string[];
  item: SystemEquipment;
  onToggle: (equipmentName: string, checked: boolean) => void;
}

export interface CabinEquipmentInputProps {
  equipment: string[];
  setEquipment: React.Dispatch<React.SetStateAction<string[]>>;
}
