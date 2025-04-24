
import { Location, Cabin } from "@/lib/types";
import { LocationsOverview } from "./LocationsOverview";
import { CabinManagement } from "./CabinManagement";
import { PricingSettings } from "./PricingSettings";
import { EquipmentSettings } from "./EquipmentSettings";
import { AvailabilitySettings } from "./AvailabilitySettings";
import { LocationSettings } from "./LocationSettings";
import { EmptyLocationState } from "./EmptyLocationState";

interface DashboardContentProps {
  selectedLocation: Location | null;
  userLocations: Location[];
  locationCabins: Cabin[];
  activeTab: string;
  onAddLocation: () => void;
  onAddCabin: () => void;
  onCabinAdded: (cabin: Cabin) => void;
  onCabinUpdated: (cabin: Cabin) => void;
  onCabinDeleted: (cabinId: string) => void;
}

export const DashboardContent = ({
  selectedLocation,
  userLocations,
  locationCabins,
  activeTab,
  onAddLocation,
  onAddCabin,
  onCabinAdded,
  onCabinUpdated,
  onCabinDeleted
}: DashboardContentProps) => {
  if (!selectedLocation && userLocations.length === 0) {
    return <EmptyLocationState onAddLocation={onAddLocation} />;
  }

  if (!selectedLocation) return null;

  return (
    <>
      {activeTab === "locations" && (
        <LocationsOverview 
          selectedLocation={selectedLocation}
          locationCabins={locationCabins}
          onAddCabinClick={onAddCabin}
        />
      )}
      
      {activeTab === "cabins" && (
        <CabinManagement 
          selectedLocation={selectedLocation}
          locationCabins={locationCabins}
          onCabinAdded={onCabinAdded}
          onCabinUpdated={onCabinUpdated}
          onCabinDeleted={onCabinDeleted}
        />
      )}
      
      {activeTab === "pricing" && (
        <PricingSettings
          selectedLocation={selectedLocation}
          locationCabins={locationCabins}
        />
      )}
      
      {activeTab === "equipment" && (
        <EquipmentSettings
          selectedLocation={selectedLocation}
          locationCabins={locationCabins}
        />
      )}
      
      {activeTab === "availability" && (
        <AvailabilitySettings
          selectedLocation={selectedLocation}
          locationCabins={locationCabins}
        />
      )}
      
      {activeTab === "settings" && (
        <LocationSettings selectedLocation={selectedLocation} />
      )}
    </>
  );
};
