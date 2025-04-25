import { Link } from "react-router-dom";
import { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const professionalAvatars = {
  female: [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
  ],
  male: [
    "https://images.unsplash.com/photo-1519340333755-c6eb8f2aaa9b?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
  ],
};

function detectGender(name: string): "male" | "female" {
  const femaleNames = [
    "ana", "mariana", "fernanda", "silva", "santos", "lima"
  ];
  if (
    femaleNames.some((f) => name.toLowerCase().includes(f)) ||
    name.trim().toLowerCase().split(" ")[0].endsWith("a")
  ) {
    return "female";
  }
  return "male";
}

interface ProfessionalCardProps {
  professional: User;
}

const ProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  // Use the user's real avatar if available
  const avatarUrl = professional.avatarUrl || professional.avatar_url;
  const rating = 4.5;

  // Make sure specialties is always an array
  const specialties = Array.isArray(professional.specialties) ? professional.specialties : [];

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
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating}</span>
          </div>
          
          {/* Available indicator */}
          <div className="mt-2 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-xs text-green-600">Disponível</span>
          </div>
          
          {specialties.length > 0 ? (
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
          ) : (
            <div className="mt-3 text-xs text-gray-500">Especialidades não definidas</div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProfessionalCard;
