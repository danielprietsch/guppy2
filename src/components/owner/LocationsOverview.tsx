
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Location, Cabin } from "@/lib/types";

interface LocationsOverviewProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const LocationsOverview = ({ 
  selectedLocation,
  locationCabins
}: LocationsOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedLocation?.name}</CardTitle>
        <CardDescription>
          {selectedLocation?.address}, {selectedLocation?.city}-{selectedLocation?.state}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cabines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{locationCabins.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Reservas Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Receita (Mês)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">R$ 0</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
