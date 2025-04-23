
import { Link } from "react-router-dom";
import { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

interface ProviderCardProps {
  provider: User;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  // This would normally be calculated from reviews
  const rating = 4.5;

  return (
    <Link to={`/providers/${provider.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square overflow-hidden">
          <img
            src={provider.avatarUrl}
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
