import { Building, DollarSign, Calendar, Plus, Settings, Bed, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationSelector } from "./LocationSelector";
import { Location } from "@/lib/types";

interface OwnerSidebarProps {
  userLocations: Location[];
  selectedLocation: Location | null;
  onLocationChange: (locationId: string) => void;
  onLocationCreated?: (location: Location) => void; 
  onLocationDeleted?: (locationId: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const OwnerSidebar = ({
  userLocations,
  selectedLocation,
  onLocationChange,
  onLocationCreated,
  onLocationDeleted,
  activeTab,
  setActiveTab
}: OwnerSidebarProps) => {
  return (
    <aside className="w-full md:w-64 space-y-4">
      <LocationSelector
        userLocations={userLocations}
        selectedLocation={selectedLocation}
        onLocationChange={onLocationChange}
        onLocationCreated={onLocationCreated}
        onLocationDeleted={onLocationDeleted}
      />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <Button
            variant={activeTab === "locations" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("locations")}
          >
            <Building className="mr-2 h-4 w-4" />
            Visão geral
          </Button>
          <Button
            variant={activeTab === "cabins" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("cabins")}
          >
            <Bed className="mr-2 h-4 w-4" />
            Cabines
          </Button>
          <Button
            variant={activeTab === "pricing" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("pricing")}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Preços
          </Button>
          <Button
            variant={activeTab === "equipment" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("equipment")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Equipamentos
          </Button>
          <Button
            variant={activeTab === "availability" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("availability")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Disponibilidade
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <Button
            variant={activeTab === "reports" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("reports")}
          >
            <FileBarChart className="mr-2 h-4 w-4" />
            Relatórios
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
};
