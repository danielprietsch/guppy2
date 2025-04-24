
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
import { PlusCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { debugLog, debugError } from "@/utils/debugLogger";

interface LocationSelectorProps {
  userLocations: Location[];
  selectedLocation: Location | null;
  onLocationChange: (locationId: string) => void;
  onLocationCreated?: (loc: Location) => void;
  onLocationDeleted?: (locationId: string) => void;
}

export const LocationSelector = ({
  userLocations,
  selectedLocation,
  onLocationChange,
  onLocationCreated,
  onLocationDeleted
}: LocationSelectorProps) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const handleLocationCreated = (newLocation: Location) => {
    if (onLocationCreated) {
      debugLog("LocationSelector: Nova localização criada", newLocation);
      onLocationCreated(newLocation);
    }
  };

  const handleDeleteClick = (location: Location, event: React.MouseEvent) => {
    event.stopPropagation();
    setLocationToDelete(location);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;

    try {
      debugLog("LocationSelector: Excluindo localização", locationToDelete.id);
      
      // Excluir localização
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationToDelete.id);
      
      if (error) {
        debugError("LocationSelector: Erro ao excluir localização:", error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o local: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      if (onLocationDeleted) {
        onLocationDeleted(locationToDelete.id);
      }
      
      toast({
        title: "Local excluído",
        description: "O local foi excluído com sucesso."
      });
    } catch (error: any) {
      debugError("LocationSelector: Erro no processo de exclusão:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o local: " + (error.message || "Erro desconhecido"),
        variant: "destructive"
      });
    } finally {
      setDeleteModalOpen(false);
      setLocationToDelete(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Meus Locais</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {userLocations.map((location) => (
            <button
              key={location.id}
              onClick={() => onLocationChange(location.id)}
              className="w-full"
            >
              <div 
                className={cn(
                  "flex items-center gap-3 p-2 hover:bg-accent transition-colors",
                  selectedLocation?.id === location.id && "bg-accent"
                )}
              >
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={location.imageUrl} 
                    alt={location.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/100?text=" + encodeURIComponent(location.name.substring(0, 1));
                    }}
                  />
                </div>
                <span className="font-medium text-sm flex-1 text-left">{location.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={(e) => handleDeleteClick(location, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-3 border-t">
          <Button
            variant="default"
            className="w-full bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            onClick={() => setAddModalOpen(true)}
          >
            <PlusCircle className="mr-2" />
            Cadastrar Novo Local
          </Button>
        </div>
        
        <OwnerAddLocationModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          onLocationCreated={handleLocationCreated}
        />

        {locationToDelete && (
          <DeleteConfirmationDialog
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            onConfirm={handleDeleteConfirm}
            title="Excluir Local"
            description={`Tem certeza que deseja excluir o local "${locationToDelete.name}"? Esta ação não pode ser desfeita e todas as cabines associadas serão excluídas também.`}
          />
        )}
      </CardContent>
    </Card>
  );
};
