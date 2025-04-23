import { Cabin, Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const cabinImages = [
  "https://images.unsplash.com/photo-1580130544977-da0c765f90d4?auto=format&fit=crop&w=800&q=80", // Professional hair station
  "https://images.unsplash.com/photo-1519823551089-5d6f7ea4f91b?auto=format&fit=crop&w=800&q=80", // Modern salon workstation
  "https://images.unsplash.com/photo-1622374812598-2dde6d9eeafb?auto=format&fit=crop&w=800&q=80", // Beauty cabin interior
  "https://images.unsplash.com/photo-1497366811353-6870989d8005?auto=format&fit=crop&w=800&q=80", // Stylish salon workspace
  "https://images.unsplash.com/photo-1615228402326-7adf9a257f2b?auto=format&fit=crop&w=800&q=80", // Professional beauty cabin
];

interface CabinCardProps {
  cabin: Cabin;
  location?: Location;
}

const CabinCard = ({ cabin, location }: CabinCardProps) => {
  const imageIndex = parseInt(cabin.id.replace(/\D/g, ""), 10) % cabinImages.length;
  const cabinImage = cabinImages[imageIndex];

  const displayImage = cabinImage;

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
          src={displayImage}
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
