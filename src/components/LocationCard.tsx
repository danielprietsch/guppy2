
import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface LocationCardProps {
  location: Location;
}

const LocationCard = ({ location }: LocationCardProps) => {
  return (
    <Link to={`/locations/${location.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{location.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{location.address}, {location.city}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {location.cabinsCount} cabines
            </span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {location.openingHours.open} - {location.openingHours.close}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex flex-wrap gap-1">
          {location.amenities.map((amenity, index) => (
            <span
              key={index}
              className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full"
            >
              {amenity}
            </span>
          ))}
        </CardFooter>
      </Card>
    </Link>
  );
};

export default LocationCard;
