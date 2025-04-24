
import { Location, Cabin } from "@/lib/types";
import { LocationDetailsCard } from "./dashboard/LocationDetailsCard";
import { LocationMetricsCard } from "./dashboard/LocationMetricsCard";
import { AddCabinCard } from "./dashboard/AddCabinCard";
import { memo } from "react";

interface LocationsOverviewProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
  onAddCabinClick: () => void;
}

export const LocationsOverview = memo(({ 
  selectedLocation,
  locationCabins,
  onAddCabinClick
}: LocationsOverviewProps) => {
  if (!selectedLocation) return null;
  
  return (
    <div className="space-y-6">
      {/* Location Details Card */}
      <LocationDetailsCard location={selectedLocation} />

      {/* Metrics Card */}
      <LocationMetricsCard cabinsCount={locationCabins.length} />

      {/* Add Cabin Card */}
      <AddCabinCard onAddCabinClick={onAddCabinClick} />
    </div>
  );
});

LocationsOverview.displayName = "LocationsOverview";
