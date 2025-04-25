
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Service } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Trash } from "lucide-react";

interface ServiceEditCardProps {
  service: Service;
  onServiceUpdated: () => void;
  onServiceDeleted: () => void;
}

const ServiceEditCard = ({ service, onServiceUpdated, onServiceDeleted }: ServiceEditCardProps) => {
  const [price, setPrice] = useState(service.price);
  const [duration, setDuration] = useState(service.duration);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setPrice(value);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setDuration(value);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          price,
          duration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: "Serviço atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      onServiceUpdated();
    } catch (error: any) {
      console.error('Error updating service:', error);
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message || "Ocorreu um erro ao atualizar o serviço",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', service.id);

      if (error) throw error;

      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso.",
      });
      onServiceDeleted();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast({
        title: "Erro ao excluir serviço",
        description: error.message || "Ocorreu um erro ao excluir o serviço",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preço (R$)</label>
              <Input
                type="number"
                value={price}
                onChange={handlePriceChange}
                min="0"
                step="0.01"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duração (min)</label>
              <Input
                type="number"
                value={duration}
                onChange={handleDurationChange}
                min="1"
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || isUpdating}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span className="ml-2">Excluir</span>
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={isUpdating || isDeleting}
            size="sm"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span className="ml-2">Salvar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceEditCard;
