
import { Building, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyLocationStateProps {
  onAddLocation: () => void;
}

export const EmptyLocationState = ({ onAddLocation }: EmptyLocationStateProps) => {
  return (
    <Card className="bg-muted/50">
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <Building className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum local cadastrado</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Para começar a gerenciar suas cabines, primeiro você precisa cadastrar um local.
          Cada local pode ter múltiplas cabines.
        </p>
        <Button 
          onClick={onAddLocation}
          className="mt-4 bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Cadastrar meu primeiro local
        </Button>
      </CardContent>
    </Card>
  );
};
