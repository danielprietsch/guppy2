
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Location, Cabin } from "@/lib/types";

interface PricingSettingsProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const PricingSettings = ({ 
  selectedLocation, 
  locationCabins 
}: PricingSettingsProps) => {
  const [cabinPrice, setCabinPrice] = useState<Record<string, number>>(() => {
    const initialPrices: Record<string, number> = {};
    locationCabins.forEach((cabin) => {
      initialPrices[cabin.id] = cabin.price || 100;
    });
    return initialPrices;
  });

  const handlePriceChange = (cabinId: string, price: string) => {
    setCabinPrice((prev) => ({
      ...prev,
      [cabinId]: parseInt(price) || 0,
    }));
  };

  const handleSavePricing = () => {
    toast({
      title: "Preços atualizados",
      description: "Os preços das cabines foram atualizados com sucesso.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Preços - {selectedLocation?.name}</CardTitle>
        <CardDescription>
          Defina os preços das cabines para aluguel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locationCabins.map((cabin) => (
            <div key={cabin.id} className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor={`price-${cabin.id}`}>{cabin.name}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">R$</span>
                  <Input
                    id={`price-${cabin.id}`}
                    type="number"
                    value={cabinPrice[cabin.id] || ""}
                    onChange={(e) => handlePriceChange(cabin.id, e.target.value)}
                    className="max-w-[100px]"
                  />
                  <span className="text-muted-foreground">por período</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSavePricing}>Salvar Preços</Button>
      </CardFooter>
    </Card>
  );
};
