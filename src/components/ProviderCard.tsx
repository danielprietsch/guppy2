import { Link } from "react-router-dom";
import { User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

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

interface ProviderCardProps {
  provider: User;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  const gender = detectGender(provider.name);
  const avatars = professionalAvatars[gender];
  const imageIndex = parseInt(provider.id.replace(/\D/g, ""), 10) % avatars.length;
  const avatarUrl = avatars[imageIndex];

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
