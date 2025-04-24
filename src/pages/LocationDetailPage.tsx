
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Location, Cabin } from "@/lib/types";
import { locations, cabins } from "@/lib/mock-data";
import CabinCard from "@/components/CabinCard";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, ArrowLeft } from "lucide-react";

const beautySalonImage =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80";

function formatAddressForMaps(address: string, city: string, state: string) {
  const full = `${address}, ${city}, ${state}`.replace(/\s/g, "+");
  return encodeURIComponent(full);
}

const LocationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [location, setLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);

  useEffect(() => {
    if (id) {
      const foundLocation = locations.find(loc => loc.id === id);
      setLocation(foundLocation || null);

      const foundCabins = cabins.filter(cabin => cabin.locationId === id);
      setLocationCabins(foundCabins);
    }
  }, [id]);

  if (!location) {
    return (
      <div className="container px-4 py-12 md:px-6 md:py-16 text-center">
        <h2>Local não encontrado</h2>
        <Link to="/locations">
          <Button className="mt-4">Voltar para Locais</Button>
        </Link>
      </div>
    );
  }

  const googleMapEmbedUrl = `https://www.google.com/maps?q=${formatAddressForMaps(location.address, location.city, location.state)}&output=embed`;

  return (
    <div>
      <div className="relative h-64 md:h-96 flex flex-col md:flex-row">
        <div className="relative w-full md:w-3/4 h-64 md:h-96">
          <img
            src={beautySalonImage}
            alt="Salão de beleza"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <Link to="/locations" className="flex items-center gap-2 text-sm hover:underline mb-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Locais
            </Link>
            <h1 className="text-3xl font-bold">{location.name}</h1>
            <div className="mt-2 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {location.address}, {location.city}, {location.state}
              </span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/4 flex items-center justify-center md:relative mt-2 md:mt-0">
          <div className="w-full h-44 md:h-full md:rounded-lg md:shadow-lg overflow-hidden">
            <iframe
              title="Mapa"
              src={googleMapEmbedUrl}
              width="100%"
              height="100%"
              className="border-0 w-full h-full"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ minHeight: '160px', borderRadius: '0.5rem' }}
            />
          </div>
        </div>
      </div>

      <div className="container px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold">Sobre este local</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium">Cabines disponíveis</h3>
                <p className="text-gray-500">{location.cabinsCount} cabines equipadas para serviços de beleza</p>
              </div>
              <div>
                <h3 className="font-medium">Horário de funcionamento</h3>
                <div className="mt-1 flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>
                    {location.openingHours.open} - {location.openingHours.close}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Comodidades</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {location.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Preços</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span>Domingo a Quinta</span>
                <span className="font-medium">R$ 100,00 / turno</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sexta e Sábado</span>
                <span className="font-medium">R$ 150,00 / turno</span>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="text-sm font-medium">Turnos disponíveis</h4>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-md border p-2">
                  <div>Manhã</div>
                  <div className="mt-1 text-xs text-gray-500">
                    08:00 - 12:00
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div>Tarde</div>
                  <div className="mt-1 text-xs text-gray-500">
                    13:00 - 17:00
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div>Noite</div>
                  <div className="mt-1 text-xs text-gray-500">
                    18:00 - 22:00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold">Cabines disponíveis</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {locationCabins.length > 0 ? (
              locationCabins.map((cabin) => (
                <CabinCard key={cabin.id} cabin={cabin} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium">Nenhuma cabine disponível</h3>
                <p className="mt-1 text-gray-500">
                  No momento, não há cabines disponíveis neste local.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationDetailPage;
