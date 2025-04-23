
import { Cabin, Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CabinCardProps {
  cabin: Cabin;
  location?: Location;
}

const CabinCard = ({ cabin, location }: CabinCardProps) => {
  const formatShiftStatus = (isAvailable: boolean) => {
    return isAvailable ? (
      <span className="text-green-600">Disponível</span>
    ) : (
      <span className="text-red-500">Indisponível</span>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video overflow-hidden">
        <img
          src={cabin.imageUrl}
          alt={cabin.name}
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold">{cabin.name}</h3>
        {location && (
          <p className="text-sm text-muted-foreground">
            {location.name}, {location.city}
          </p>
        )}
        <p className="text-sm mt-2">{cabin.description}</p>
        <ul className="mt-2 space-y-1">
          {cabin.equipment.map((item, index) => (
            <li key={index} className="text-xs flex items-center gap-1">
              <span>•</span> {item}
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="font-medium">Manhã</div>
            <div>{formatShiftStatus(cabin.availability.morning)}</div>
          </div>
          <div>
            <div className="font-medium">Tarde</div>
            <div>{formatShiftStatus(cabin.availability.afternoon)}</div>
          </div>
          <div>
            <div className="font-medium">Noite</div>
            <div>{formatShiftStatus(cabin.availability.evening)}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/book-cabin/${cabin.id}`} className="w-full">
          <Button size="sm" className="w-full">
            Reservar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CabinCard;
