
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
        "relative flex flex-col items-center p-6 rounded-lg border-2 transition-colors cursor-pointer hover:bg-accent min-h-[200px] w-full",
        checked ? "border-primary bg-accent" : "border-input"
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          id={`checkbox-${id}`}
        />
      </div>
      <div className="mb-4 text-primary p-4 bg-background rounded-full">
        {getIconForSpecialty(id)}
      </div>
      <span className="text-lg font-semibold text-center mb-2">{label}</span>
      <p className="text-sm text-muted-foreground text-center">
        {getServiceDescription(id)}
      </p>
    </div>
  );
};

const getServiceDescription = (id: string): string => {
  switch (id) {
    // Cabelo
    case "corte_cabelo":
      return "Corte personalizado com acabamento profissional";
    case "coloracao":
      return "Coloração completa com produtos de alta qualidade";
    case "luzes":
      return "Mechas e luzes com técnicas modernas";
    case "escova":
      return "Escova e finalização para todos os tipos de cabelo";
    case "hidratacao":
      return "Tratamento profundo de hidratação capilar";
      
    // Mãos e Pés
    case "manicure_comum":
      return "Cuidados completos para suas unhas";
    case "manicure_gel":
      return "Alongamento e esmaltação em gel";
    case "pedicure_comum":
      return "Cuidados especializados para seus pés";
    case "pedicure_spa":
      return "Tratamento relaxante com hidratação";
      
    // Maquiagem
    case "maquiagem_social":
      return "Maquiagem para eventos e ocasiões especiais";
    case "maquiagem_noiva":
      return "Maquiagem especializada para noivas";
      
    // Estética
    case "design_sobrancelhas":
      return "Design e modelagem de sobrancelhas";
    case "depilacao_cera":
      return "Depilação com cera quente ou fria";
    case "depilacao_laser":
      return "Depilação a laser com tecnologia avançada";
      
    // Barba
    case "barba":
      return "Modelagem e acabamento de barba";
      
    // Bem-estar
    case "massagem_relaxante":
      return "Massagem terapêutica para relaxamento";
    case "limpeza_pele":
      return "Limpeza de pele profunda e hidratação";
      
    default:
      return "Serviço especializado";
  }
};

export default SpecialtyCard;
