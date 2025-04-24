
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Cabin, Location } from "@/lib/types";
import { AddCabinModal } from "./AddCabinModal";
import { EditCabinModal } from "./EditCabinModal";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

interface CabinManagementProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
  onCabinAdded?: (cabin: Cabin) => void;
  onCabinUpdated?: (cabin: Cabin) => void;
  onCabinDeleted?: (cabinId: string) => void;
}

export const CabinManagement = ({
  selectedLocation,
  locationCabins,
  onCabinAdded,
  onCabinUpdated,
  onCabinDeleted
}: CabinManagementProps) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [cabinToDelete, setCabinToDelete] = useState<Cabin | null>(null);

  const handleEditCabin = (cabin: Cabin) => {
    setSelectedCabin(cabin);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (cabin: Cabin) => {
    setCabinToDelete(cabin);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cabinToDelete) return;

    try {
      onCabinDeleted?.(cabinToDelete.id);
      toast({
        title: "Cabine excluída",
        description: "A cabine foi excluída com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a cabine.",
        variant: "destructive"
      });
    } finally {
      setDeleteModalOpen(false);
      setCabinToDelete(null);
    }
  };

  if (!selectedLocation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Cabines</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Selecione um local para gerenciar suas cabines.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cabines de {selectedLocation?.name}</CardTitle>
        <Button
          variant="default"
          className="bg-gradient-to-r from-guppy-primary to-guppy-secondary hover:from-guppy-secondary hover:to-guppy-primary transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg"
          onClick={() => setAddModalOpen(true)}
        >
          <PlusCircle className="mr-2" />
          Adicionar Cabine
        </Button>
      </CardHeader>
      <CardContent>
        {locationCabins.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Este local ainda não possui cabines cadastradas.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {locationCabins.map((cabin) => (
              <Card key={cabin.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{cabin.name}</h3>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCabin(cabin)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(cabin)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{cabin.description}</p>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between">
                        <span>Equipamentos:</span>
                        <span>{cabin.equipment.length}</span>
                      </div>
                      {cabin.price && (
                        <div className="flex justify-between mt-1">
                          <span>Preço base:</span>
                          <span>R$ {cabin.price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modals */}
        <AddCabinModal 
          open={addModalOpen} 
          onOpenChange={setAddModalOpen} 
          locationId={selectedLocation?.id || ""}
          onCabinCreated={onCabinAdded}
        />

        {selectedCabin && (
          <EditCabinModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            cabin={selectedCabin}
            onCabinUpdated={onCabinUpdated}
          />
        )}

        {cabinToDelete && (
          <DeleteConfirmationDialog
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            onConfirm={handleDeleteConfirm}
            title="Excluir Cabine"
            description={`Tem certeza que deseja excluir a cabine "${cabinToDelete.name}"? Esta ação não pode ser desfeita.`}
          />
        )}
      </CardContent>
    </Card>
  );
};
