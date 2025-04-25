
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
  HandHelping,
  Clock, 
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpecialtyCardProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

// Service data mapping (in a real app, this would come from an API)
const serviceData = {
  // Cabelo
  "corte_cabelo": { duration: 30, price: 50, category: "Cabelo" },
  "coloracao": { duration: 120, price: 150, category: "Cabelo" },
  "luzes": { duration: 180, price: 200, category: "Cabelo" },
  "escova": { duration: 40, price: 60, category: "Cabelo" },
  "hidratacao": { duration: 60, price: 80, category: "Cabelo" },
  
  // Mãos e Pés
  "manicure_comum": { duration: 40, price: 35, category: "Manicure" },
  "manicure_gel": { duration: 60, price: 80, category: "Manicure" },
  "pedicure_comum": { duration: 50, price: 45, category: "Pedicure" },
  "pedicure_spa": { duration: 90, price: 90, category: "Pedicure" },
  
  // Maquiagem
  "maquiagem_social": { duration: 60, price: 120, category: "Maquiagem" },
  "maquiagem_noiva": { duration: 120, price: 250, category: "Maquiagem" },
  
  // Estética
  "design_sobrancelhas": { duration: 30, price: 40, category: "Estética" },
  "depilacao_cera": { duration: 60, price: 80, category: "Depilação" },
  "depilacao_laser": { duration: 60, price: 150, category: "Depilação" },
  
  // Barba
  "barba": { duration: 30, price: 40, category: "Barba" },
  
  // Bem-estar
  "massagem_relaxante": { duration: 60, price: 120, category: "Massagem" },
  "limpeza_pele": { duration: 60, price: 100, category: "Tratamento Facial" },
};

// Get category colors
const getCategoryColor = (category: string) => {
  switch (category) {
    case "Cabelo": return "bg-purple-100 text-purple-800";
    case "Manicure": 
    case "Pedicure": return "bg-pink-100 text-pink-800";
    case "Maquiagem": return "bg-orange-100 text-orange-800";
    case "Estética": return "bg-blue-100 text-blue-800";
    case "Depilação": return "bg-red-100 text-red-800";
    case "Barba": return "bg-slate-100 text-slate-800";
    case "Massagem": return "bg-green-100 text-green-800";
    case "Tratamento Facial": return "bg-sky-100 text-sky-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// Get icon for service
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

const SpecialtyCard = ({ id, label, checked, onCheckedChange }: SpecialtyCardProps) => {
  const serviceInfo = serviceData[id as keyof typeof serviceData] || { duration: 30, price: 50, category: "Outro" };
  
  return (
    <div
      className={cn(
        "relative flex flex-col items-start p-6 rounded-lg border-2 transition-colors cursor-pointer hover:bg-accent min-h-[250px] w-full",
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
      
      <div className="flex items-center gap-3 mb-4 w-full">
        <div className="text-primary p-3 bg-background rounded-full shadow-sm">
          {getIconForSpecialty(id)}
        </div>
        <span className="text-xl font-semibold">{label}</span>
      </div>
      
      <div className="mb-4 w-full">
        <Badge className={cn("px-3 py-1 text-xs", getCategoryColor(serviceInfo.category))}>
          <div className="flex items-center gap-1.5">
            {getIconForSpecialty(id)}
            <span>{serviceInfo.category}</span>
          </div>
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        {getServiceDescription(id)}
      </p>
      
      <div className="mt-auto w-full flex justify-between items-center pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">{serviceInfo.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <DollarSign className="h-4 w-4" />
          <span>R$ {serviceInfo.price}</span>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyCard;
