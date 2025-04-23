import { Link } from "react-router-dom";
import { Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

// Updated list of beauty salon interior and workspace images
const beautySalonImages = [
  "https://images.unsplash.com/photo-1519823551089-5d6f7ea4f91b?auto=format&fit=crop&w=800&q=80", // Modern salon interior
  "https://images.unsplash.com/photo-1622374812598-2dde6d9eeafb?auto=format&fit=crop&w=800&q=80", // Salon workstations
  "https://images.unsplash.com/photo-1519985176146-9ff4a5f5a6d1?auto=format&fit=crop&w=800&q=80", // Stylish salon space
  "https://images.unsplash.com/photo-1493612276216-9820ee2a5b1b?auto=format&fit=crop&w=800&q=80", // Professional salon setting
  "https://images.unsplash.com/photo-1499155286265-79a9dc9c6380?auto=format&fit=crop&w=800&q=80", // Elegant salon interior
];

function formatAddressForMaps(address: string, city: string, state: string) {
  const full = `${address}, ${city}, ${state}`.replace(/\s/g, "+");
  return encodeURIComponent(full);
}

interface LocationCardProps {
  location: Location;
}

const LocationCard = ({ location }: LocationCardProps) => {
  // Selects a beauty salon image based on the location's id
  const imageIndex = parseInt(location.id.replace(/\D/g, ""), 10) % beautySalonImages.length;
  const beautySalonImage = beautySalonImages[imageIndex];

  const googleMapEmbedUrl = `https://www.google.com/maps?q=${formatAddressForMaps(location.address, location.city, location.state)}&output=embed`;

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
        {/* Mini mapa agora vai abaixo da imagem principal */}
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
