
import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

export const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: DeleteConfirmationDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const isValid = confirmText.toLowerCase() === "deletar";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {description}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Digite "deletar" para confirmar
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="deletar"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isValid}
          >
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
