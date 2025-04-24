
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { memo } from "react";

interface AddCabinCardProps {
  onAddCabinClick: () => void;
}

export const AddCabinCard = memo(({ onAddCabinClick }: AddCabinCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Nova Cabine</CardTitle>
        <CardDescription>
          Cadastre uma nova cabine neste local para expandir seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="default"
          className="w-full bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          onClick={onAddCabinClick}
        >
          <PlusCircle className="mr-2" />
          Cadastrar Nova Cabine
        </Button>
      </CardContent>
    </Card>
  );
});

AddCabinCard.displayName = "AddCabinCard";
