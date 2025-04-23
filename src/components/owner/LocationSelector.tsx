
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Location } from "@/lib/types";
import { OwnerAddLocationModal } from "./OwnerAddLocationModal";
import { PlusCircle } from "lucide-react";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus Locais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select
          value={selectedLocation?.id}
          onValueChange={onLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um local" />
          </SelectTrigger>
          <SelectContent>
            {userLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="default"
          className="w-full mt-4 bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          onClick={() => setAddModalOpen(true)}
        >
          <PlusCircle className="mr-2" />
          Cadastrar Novo Local
        </Button>
        <OwnerAddLocationModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onLocationCreated={onLocationCreated}
        />
      </CardContent>
    </Card>
  );
};
