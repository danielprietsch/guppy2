import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Scissors, 
  SprayCan, 
  Brush, 
  HandMetal,
  Heart,
  Sparkles,
  Star,
  HandHelping
} from "lucide-react";

interface SpecialtyCardProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const getIconForSpecialty = (id: string) => {
  switch (id) {
    // Cabelo
    case "corte_cabelo":
      return <Scissors className="h-5 w-5" />;
    case "coloracao":
    case "luzes":
      return <SprayCan className="h-5 w-5" />;
    case "escova":
    case "hidratacao":
      return <Brush className="h-5 w-5" />;
      
    // Mãos e Pés
    case "manicure_comum":
    case "manicure_gel":
    case "pedicure_comum":
    case "pedicure_spa":
      return <HandMetal className="h-5 w-5" />;
      
    // Maquiagem
    case "maquiagem_social":
    case "maquiagem_noiva":
      return <Sparkles className="h-5 w-5" />;
      
    // Estética
    case "design_sobrancelhas":
      return <Star className="h-5 w-5" />;
    case "depilacao_cera":
    case "depilacao_laser":
      return <Sparkles className="h-5 w-5" />;
      
    // Barba
    case "barba":
      return <Scissors className="h-5 w-5" />;
      
    // Bem-estar
    case "massagem_relaxante":
      return <HandHelping className="h-5 w-5" />;
    case "limpeza_pele":
      return <Heart className="h-5 w-5" />;
      
    // Padrão
    default:
      return <Star className="h-5 w-5" />;
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
