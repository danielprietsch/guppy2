
import React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Scissors, 
  SprayCan, 
  Brush, 
  HandMetal,
  Heart,
  Sparkles,
  Star,
  HandHelping,
  Hand,          
  Footprints,    
  ScissorsSquare 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { serviceData } from "@/utils/serviceData";

interface SpecialtyCardProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  price?: number;
  duration?: number;
  onPriceChange?: (price: number) => void;
  onDurationChange?: (duration: number) => void;
}

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
      return <Hand className="h-5 w-5" />;
    case "pedicure_comum":
    case "pedicure_spa":
      return <Footprints className="h-5 w-5" />;
      
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
      return <ScissorsSquare className="h-5 w-5" />;
      
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

const SpecialtyCard = ({ 
  id, 
  label, 
  checked, 
  onCheckedChange,
  price,
  duration,
  onPriceChange,
  onDurationChange
}: SpecialtyCardProps) => {
  const serviceInfo = serviceData[id as keyof typeof serviceData] || { duration: 30, price: 50, category: "Outro" };
  
  // Tornando o card todo clicável, mas com prevenção de comportamento indesejado
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevenindo comportamento padrão para evitar redirecionamentos
    e.preventDefault();
    onCheckedChange(!checked);
  };
  
  return (
    <div
      className={cn(
        "relative flex flex-col items-start p-6 rounded-lg border-2 transition-colors cursor-pointer",
        checked 
          ? "border-primary bg-[#D3E4FD] text-foreground" // Light, soft blue when selected
          : "border-input"
      )}
      onClick={handleCardClick}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCheckedChange(!checked);
        }
      }}
    >
      <div className="absolute top-4 right-4" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          id={`checkbox-${id}`}
          checked={checked}
          onCheckedChange={() => onCheckedChange(!checked)}
          className="w-8 h-8 border-2"
          aria-label={`Selecionar ${label}`}
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
      
      <div 
        className="w-full space-y-4 mt-4 pt-4 border-t border-border bg-background/80 p-4 rounded-md shadow-sm"
        onClick={(e) => e.stopPropagation()} // Impede que cliques nos inputs marquem/desmarquem o card
      >
        <div className="space-y-2">
          <Label htmlFor={`duration-${id}`} className="flex items-center gap-2 text-base font-semibold">
            <HandMetal className="h-5 w-5" />
            Duração (minutos)
          </Label>
          <Input
            id={`duration-${id}`}
            type="number"
            min="1"
            value={duration !== undefined ? duration : serviceInfo.duration}
            onChange={(e) => onDurationChange && onDurationChange(Number(e.target.value))}
            placeholder="Duração em minutos"
            className="w-full text-lg p-4 font-medium bg-white border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-primary/5 transition-all"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`price-${id}`} className="flex items-center gap-2 text-base font-semibold">
            <HandMetal className="h-5 w-5" />
            Preço (R$)
          </Label>
          <Input
            id={`price-${id}`}
            type="number"
            min="1"
            step="0.01"
            value={price !== undefined ? price : serviceInfo.price}
            onChange={(e) => onPriceChange && onPriceChange(Number(e.target.value))}
            placeholder="Valor em reais"
            className="w-full text-lg p-4 font-medium bg-white border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-primary/5 transition-all"
          />
        </div>
      </div>
    </div>
  );
};

export default SpecialtyCard;
