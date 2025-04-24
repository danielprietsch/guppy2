
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Location } from "@/lib/types";
import { OwnerAddLocationModal } from "./OwnerAddLocationModal";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSelectorProps {
  userLocations: Location[];
  selectedLocation: Location | null;
  onLocationChange: (locationId: string) => void;
  onLocationCreated?: (loc: Location) => void;
}

export const LocationSelector = ({
  userLocations,
  selectedLocation,
  onLocationChange,
  onLocationCreated
}: LocationSelectorProps) => {
  const [addModalOpen, setAddModalOpen] = useState(false);

  const handleLocationCreated = (newLocation: Location) => {
    if (onLocationCreated) {
      onLocationCreated(newLocation);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Meus Locais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
          {userLocations.map((location) => (
            <button
              key={location.id}
              onClick={() => onLocationChange(location.id)}
              className="w-full"
            >
              <Card 
                className={cn(
                  "transition-all duration-200 hover:scale-[1.02] cursor-pointer border",
                  selectedLocation?.id === location.id 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50"
                )}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                    <img 
                      src={location.imageUrl} 
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium">{location.name}</h3>
                    <p className="text-sm text-muted-foreground">{location.city}, {location.state}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">
                        {location.cabinsCount} cabines
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
        
        <Button
          variant="default"
          className="w-full bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          onClick={() => setAddModalOpen(true)}
        >
          <PlusCircle className="mr-2" />
          Cadastrar Novo Local
        </Button>
        
        <OwnerAddLocationModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onLocationCreated={handleLocationCreated}
        />
      </CardContent>
    </Card>
  );
};
