
import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const beautySalonImages = [
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=800&q=80",
];

function formatAddressForMaps(address: string, city: string, state: string) {
  const full = `${address}, ${city}, ${state}`.replace(/\s/g, "+");
  return encodeURIComponent(full);
}

interface LocationCardProps {
  location: Location;
}

const LocationCard = ({ location }: LocationCardProps) => {
  const imageIndex = parseInt(location.id.replace(/\D/g, ""), 10) % beautySalonImages.length;
  const beautySalonImage = beautySalonImages[imageIndex];

  // URL para o mapa navegável (embed padrão, sem 'output=embed&z=17')
  const googleMapEmbedUrl = `https://www.google.com/maps?q=${formatAddressForMaps(location.address, location.city, location.state)}`;

  return (
    <Link to={`/locations/${location.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-[16/9] overflow-hidden">
          <img
            src={beautySalonImage}
            alt="Salão de beleza"
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
        <div className="w-full h-28 bg-white border-t flex items-center justify-center">
          <iframe
            title={`${location.name} Mapa`}
            src={googleMapEmbedUrl}
            width="100%"
            height="100%"
            className="border-0 w-full h-full rounded-b-lg"
            allowFullScreen
            loading="lazy"
            style={{ minHeight: 60, borderRadius: '0 0 0.75rem 0.75rem' }}
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
