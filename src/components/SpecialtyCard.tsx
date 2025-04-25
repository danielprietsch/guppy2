
import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Scissors, 
  Brush, 
  SprayCan, 
  NailPolish 
} from "lucide-react";

interface SpecialtyCardProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const getIconForSpecialty = (id: string) => {
  switch (id) {
    case "corte_cabelo":
    case "barba":
      return <Scissors className="h-5 w-5" />;
    case "coloracao":
    case "luzes":
      return <SprayCan className="h-5 w-5" />;
    case "escova":
    case "hidratacao":
      return <Brush className="h-5 w-5" />;
    case "manicure_comum":
    case "manicure_gel":
    case "pedicure_comum":
    case "pedicure_spa":
      return <NailPolish className="h-5 w-5" />;
    default:
      return <Scissors className="h-5 w-5" />;
  }
};

const SpecialtyCard = ({ id, label, checked, onCheckedChange }: SpecialtyCardProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-4 rounded-lg border-2 transition-colors cursor-pointer hover:bg-accent",
        checked ? "border-primary bg-accent" : "border-input"
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="absolute top-2 right-2">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </div>
      <div className="mb-2 text-primary">
        {getIconForSpecialty(id)}
      </div>
      <span className="text-sm text-center font-medium">{label}</span>
    </div>
  );
};

export default SpecialtyCard;
