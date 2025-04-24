
import { MapPin, Clock, Building } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Location } from "@/lib/types";

interface LocationOverviewProps {
  location: Location;
}

export const LocationOverview = ({ location }: LocationOverviewProps) => {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">{location.name}</h3>
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{location.address}, {location.city} - {location.state}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{location.openingHours.open} - {location.openingHours.close}</span>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-2 text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>{location.cabinsCount} cabine{location.cabinsCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
