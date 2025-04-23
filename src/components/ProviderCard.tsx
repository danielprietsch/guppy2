
import { Link } from "react-router-dom";
import { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

// Fotos de profissionais visualmente profissionais e bem arrumados
const professionalAvatars = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
  "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=facearea&w=400&h=400&facepad=3&q=80",
];

interface ProviderCardProps {
  provider: User;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  // Garante variedade para cada provider na lista
  const imageIndex = parseInt(provider.id.replace(/\D/g, ""), 10) % professionalAvatars.length;
  const avatarUrl = professionalAvatars[imageIndex];

  // This would normally be calculated from reviews
  const rating = 4.5;

  return (
    <Link to={`/providers/${provider.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square overflow-hidden">
          <img
            src={avatarUrl}
            alt={provider.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{provider.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{rating}</span>
          </div>
          <div className="mt-2">
            {provider.specialties?.map((specialty, index) => (
              <span
                key={index}
                className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-1"
              >
                {specialty}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProviderCard;
