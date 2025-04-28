
import { Service } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface ServiceCardProps {
  service: Service;
}

const ServiceCard = ({ service }: ServiceCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const getLocationText = (locationType: string | undefined) => {
    switch (locationType) {
      case 'cabin':
        return 'No estabelecimento';
      case 'professional_location':
        return 'No local do profissional';
      case 'both':
        return 'Estabelecimento ou local do profissional';
      default:
        return 'No estabelecimento';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <h3 className="font-semibold">{service.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-xs">{service.duration} minutos</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="text-xs">{getLocationText(service.locationType)}</span>
        </div>
        <p className="text-sm mt-2">{service.description}</p>
        <div className="mt-2">
          <span className="font-medium">{formatPrice(service.price)}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/book-service/${service.id}`} className="w-full">
          <Button size="sm" className="w-full">
            Agendar
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
