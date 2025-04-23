
import React, { useState, useEffect } from "react";
import { cabins, locations } from "@/lib/mock-data";
import { Cabin, Booking, User, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import CabinAvailabilityCalendar from "@/components/CabinAvailabilityCalendar";
import { toast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";

// Função auxiliar para calcular distância entre duas lat/lng com Haversine
function getDistance(
  lat1: number, lon1: number, lat2: number, lon2: number
) {
  const toRad = (val: number) => (val * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type Props = {
  currentUser: User;
  providerBookings: Booking[];
  open: boolean;
  onClose: () => void;
  onSubmitBookings: (newBookings: Booking[]) => void;
};

const CabinBookingModal: React.FC<Props> = ({
  currentUser,
  providerBookings,
  open,
  onClose,
  onSubmitBookings,
}) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [errorLocation, setErrorLocation] = useState<string | null>(null);
  const [filteredCabins, setFilteredCabins] = useState<Cabin[]>([]);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(null);
  const [calendarTurn, setCalendarTurn] = useState<"morning" | "afternoon" | "evening">("morning");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  // Obter localização do usuário assim que modal abrir
  useEffect(() => {
    if (open) {
      setSelectedCabin(null);
      setSelectedDates([]);
      setCalendarTurn("morning");
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setErrorLocation(null);
          },
          () => setErrorLocation("Não foi possível acessar sua localização. Habilite a permissão no navegador.")
        );
      } else {
        setErrorLocation("Geolocalização não suportada no navegador.");
      }
    }
  }, [open]);

  // Ordenar cabines por proximidade quando localização estiver disponível
  useEffect(() => {
    if (userLocation) {
      // Cabines com local válido e filtradas por menor distância
      const cabinsWithLoc = cabins
        .map((cabin) => {
          const loc: any = locations.find((l) => l.id === cabin.locationId);
          // Checar se informações de localização de latitude/longitude existem
          if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;
          const dist = getDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng);
          return { ...cabin, _distance: dist, _location: loc };
        })
        .filter(Boolean) as Array<Cabin & { _distance: number; _location: Location & { lat: number; lng: number } }>;
      cabinsWithLoc.sort((a, b) => a._distance - b._distance);
      setFilteredCabins(cabinsWithLoc);
    } else {
      setFilteredCabins(cabins);
    }
  }, [userLocation]);

  // Controle de bookings existentes da cabine + turno
  const getCabinBookings = (cabinId: string) => {
    const mybookings = providerBookings.filter((b) => b.cabinId === cabinId);
    const byDayAndShift: { [date: string]: { [turn: string]: boolean } } = {};
    mybookings.forEach((b) => {
      if (!byDayAndShift[b.date]) byDayAndShift[b.date] = {};
      byDayAndShift[b.date][b.shift] = b.status === "confirmed";
    });
    return byDayAndShift;
  };

  // Reservar múltiplos dias no turno escolhido
  const handleReserve = () => {
    if (!selectedDates.length || !selectedCabin) return;
    const newBookings: Booking[] = selectedDates.map((dt, i) => ({
      id: `${providerBookings.length + i + 1}`,
      cabinId: selectedCabin.id,
      providerId: currentUser.id,
      date: dt,
      shift: calendarTurn,
      status: "confirmed",
      price: 100,
    }));
    onSubmitBookings(newBookings);
    toast({
      title: "Reservas realizadas",
      description: `Foram reservados ${newBookings.length} dias para o turno de ${calendarTurn === "morning" ? "Manhã" : calendarTurn === "afternoon" ? "Tarde" : "Noite"} em "${selectedCabin.name}".`,
    });
    setSelectedCabin(null);
    setSelectedDates([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-background rounded-lg max-w-2xl w-full p-6 shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl font-bold"
          aria-label="Fechar"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Reservar Cabine Próxima
        </h2>
        {errorLocation && (
          <div className="mb-4 text-sm text-red-500">{errorLocation}</div>
        )}
        {!selectedCabin ? (
          <>
            <div className="mb-4">
              <span className="font-medium">Selecione uma cabine para reservar:</span>
              <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-auto">
                {filteredCabins.map((cabin: any) => {
                  const loc = cabin._location || locations.find((l) => l.id === cabin.locationId);
                  return (
                    <button
                      key={cabin.id}
                      className="border rounded p-2 flex flex-row items-center text-left hover:bg-primary/10"
                      onClick={() => setSelectedCabin(cabin)}
                    >
                      {/* Imagem à esquerda */}
                      <img
                        src={cabin.imageUrl}
                        alt={cabin.name}
                        className="w-16 h-16 rounded-md object-cover mr-3 border"
                      />
                      <div className="flex-1 flex flex-col">
                        <span className="font-bold">{cabin.name}</span>
                        <span className="text-xs text-gray-500">
                          {loc?.name} - {loc?.city}
                          {cabin._distance !== undefined &&
                            <span> &bull; ~{cabin._distance.toFixed(1)} km</span>
                          }
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="mb-4">
              <span className="font-medium">Cabine selecionada: </span>
              <span>{selectedCabin.name}</span>
              <button className="ml-2 text-xs underline text-blue-600" onClick={() => setSelectedCabin(null)}>
                Voltar
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <span className="font-medium">Selecione o turno:</span>
              <Button
                variant={calendarTurn === "morning" ? "default" : "outline"}
                onClick={() => setCalendarTurn("morning")}
              >
                Manhã
              </Button>
              <Button
                variant={calendarTurn === "afternoon" ? "default" : "outline"}
                onClick={() => setCalendarTurn("afternoon")}
              >
                Tarde
              </Button>
              <Button
                variant={calendarTurn === "evening" ? "default" : "outline"}
                onClick={() => setCalendarTurn("evening")}
              >
                Noite
              </Button>
            </div>
            <CabinAvailabilityCalendar
              selectedTurn={calendarTurn}
              daysBooked={getCabinBookings(selectedCabin.id)}
              onSelectDates={setSelectedDates}
              selectedDates={selectedDates}
            />
            <div className="flex mt-4 gap-3 justify-end">
              <Button variant="outline" onClick={() => setSelectedCabin(null)}>
                Cancelar
              </Button>
              <Button
                disabled={selectedDates.length === 0}
                onClick={handleReserve}
              >
                Reservar dias selecionados
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CabinBookingModal;

// O ARQUIVO ESTÁ FICANDO MUITO GRANDE. Considere solicitar a refatoração dele!
