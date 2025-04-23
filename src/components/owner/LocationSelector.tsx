
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Location } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

interface LocationSelectorProps {
  userLocations: Location[];
  selectedLocation: Location | null;
  onLocationChange: (locationId: string) => void;
}

export const LocationSelector = ({ 
  userLocations, 
  selectedLocation, 
  onLocationChange 
}: LocationSelectorProps) => {
  const handleCreateLocation = () => {
    toast({
      title: "Funcionalidade em breve!",
      description: "O cadastro de locais será implementado nas próximas etapas.",
    });
  };

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
          variant="secondary"
          className="w-full mt-4"
          onClick={handleCreateLocation}
        >
          + Cadastrar Local
        </Button>
      </CardContent>
    </Card>
  );
};
