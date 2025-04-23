
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";

interface CabinEquipmentInputProps {
  equipment: string[];
  setEquipment: React.Dispatch<React.SetStateAction<string[]>>;
}

export const CabinEquipmentInput: React.FC<CabinEquipmentInputProps> = ({
  equipment,
  setEquipment
}) => {
  const [equipmentInput, setEquipmentInput] = React.useState("");

  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return;
    setEquipment([...equipment, equipmentInput.trim()]);
    setEquipmentInput("");
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  return (
    <div>
      <Label>Equipamentos</Label>
      <div className="flex gap-2 mb-2">
        <Input
          value={equipmentInput}
          onChange={(e) => setEquipmentInput(e.target.value)}
          placeholder="Adicionar equipamento"
          className="flex-1"
        />
        <Button type="button" onClick={handleAddEquipment}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        {equipment.map((item, index) => (
          <span
            key={index}
            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center"
          >
            {item}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1 text-red-500"
              onClick={() => handleRemoveEquipment(index)}
            >
              <Trash className="h-3 w-3" />
            </Button>
          </span>
        ))}
        {equipment.length === 0 && (
          <span className="text-muted-foreground text-sm">Nenhum equipamento adicionado</span>
        )}
      </div>
    </div>
  );
};
