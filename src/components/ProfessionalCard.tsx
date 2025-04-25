
import { Link } from "react-router-dom";
import { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfessionalCardProps {
  professional: User;
}

const ProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  const avatarUrl = professional.avatarUrl || professional.avatar_url;
  const initials = professional.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  const rating = 4.5;

  // Make sure specialties is always an array
  const specialties = Array.isArray(professional.specialties) ? professional.specialties : [];

  return (
    <Link to={`/professional/${professional.id}`} className="block">
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="p-4 flex flex-col items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt={professional.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg mt-4">{professional.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating}</span>
          </div>
        </div>
        
        <CardContent className="p-4 pt-0">
          {/* Available indicator */}
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-green-600">Disponível essa semana</span>
          </div>
          
          {specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-center">
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
          ) : (
            <div className="text-center text-xs text-gray-500">Especialidades não definidas</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProfessionalCard;
