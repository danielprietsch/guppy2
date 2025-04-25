
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Location, Cabin } from "@/lib/types";
import CabinAvailabilityCalendar from "@/components/CabinAvailabilityCalendar";

interface AvailabilitySettingsProps {
  selectedLocation: Location | null;
  locationCabins: Cabin[];
}

export const AvailabilitySettings = ({ 
  selectedLocation, 
  locationCabins 
}: AvailabilitySettingsProps) => {
  const [selectedCabin, setSelectedCabin] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Disponibilidade - {selectedLocation?.name}</CardTitle>
          <CardDescription>
            Configure a disponibilidade das cabines por períodos e dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locationCabins.length > 0 && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {locationCabins.map((cabin) => (
                  <button
                    key={cabin.id}
                    onClick={() => setSelectedCabin(cabin.id)}
                    className={`p-2 rounded text-sm ${
                      selectedCabin === cabin.id
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {cabin.name}
                  </button>
                ))}
              </div>

              {selectedCabin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Calendário</CardTitle>
                    <CardDescription>Visualize e configure a disponibilidade por dia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-x-auto">
                      <CabinAvailabilityCalendar
                        selectedTurn="morning"
                        daysBooked={{}}
                        onSelectDates={() => {}}
                        selectedDates={[]}
                        pricePerDay={100}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
