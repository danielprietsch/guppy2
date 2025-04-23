
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CabinEquipmentInput } from "../../equipment/CabinEquipmentInput";
import type { CabinBasicInfoProps } from "../types/cabinFormTypes";

export const CabinBasicInfo: React.FC<CabinBasicInfoProps> = ({
  name,
  setName,
  description,
  setDescription,
  equipment,
  setEquipment,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="name">Nome da Cabine</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da cabine"
          required
          className="w-full"
        />
      </div>
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da cabine"
          rows={3}
          className="w-full"
        />
      </div>
      <CabinEquipmentInput equipment={equipment} setEquipment={setEquipment} />
    </div>
  );
};
