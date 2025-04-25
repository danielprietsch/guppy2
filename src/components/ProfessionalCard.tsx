
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Professional } from "@/hooks/useProfessionals";

interface ProfessionalCardProps {
  professional: Professional;
}

const ProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  const avatarUrl = professional.avatarUrl || professional.avatar_url;
  const specialties = Array.isArray(professional.specialties) ? professional.specialties : [];
  const rating = professional.rating || 0;
  const reviewCount = professional.reviewCount || 0;

  const getAvailabilityStatus = () => {
    if (!professional.availability) return "indisponível";
    const { morning_status, afternoon_status, evening_status } = professional.availability;
    if (morning_status === "free" || afternoon_status === "free" || evening_status === "free") {
      return "disponível";
    }
    return "ocupado";
  };

  const availabilityStatus = getAvailabilityStatus();
  const availabilityColor = {
    disponível: "bg-green-500",
    ocupado: "bg-red-500",
    indisponível: "bg-gray-500",
  }[availabilityStatus];

  return (
    <Link to={`/professional/${professional.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-square overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={professional.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-lg">Sem foto</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{professional.name}</h3>
          
          {/* Rating and Reviews */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm ml-1">{rating ? rating.toFixed(1) : "0.0"}</span>
            </div>
            <span className="text-sm text-gray-500">({reviewCount} avaliações)</span>
          </div>
          
          {/* Availability Status */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`flex h-2 w-2 rounded-full ${availabilityColor}`}></span>
            <span className="text-xs capitalize">{availabilityStatus}</span>
          </div>
          
          {/* Services/Specialties */}
          {specialties.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {specialties.map((specialty, index) => (
                <Badge
                  key={index}
                  variant="outline" 
                  className="text-xs bg-primary/5 text-primary border-primary/20"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Price Range */}
          {professional.services && professional.services.length > 0 && (
            <div className="mt-3 text-sm text-gray-600">
              A partir de{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(
                Math.min(...professional.services.map((s) => s.price))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProfessionalCard;
