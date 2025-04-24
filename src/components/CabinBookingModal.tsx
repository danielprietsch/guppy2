
import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Booking, User, Cabin, Location } from "@/lib/types";
import { cabins, locations } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  currentUser: User | null;
  professionalBookings?: Booking[];
  onSubmitBookings: (bookings: Booking[]) => void;
}

const CabinBookingModal = ({ open, onClose, currentUser, professionalBookings = [], onSubmitBookings }: Props) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCabin, setSelectedCabin] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<"morning" | "afternoon" | "evening" | "">("");
  
  // Filter only available cabins
  const availableLocations = locations.filter(location => location.active);
  
  const filteredCabins = cabins.filter(cabin => {
    if (!selectedLocation) return false;
    return cabin.locationId === selectedLocation;
  });
  
  const handleBookCabin = () => {
    if (!selectedDate || !selectedCabin || !selectedShift || !currentUser) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    // Format date as ISO string for comparison
    const bookingDateStr = selectedDate.toISOString().split('T')[0];
    
    // Check if the cabin is already booked for the selected date and shift
    const isAlreadyBooked = professionalBookings.some(booking =>
      booking.cabinId === selectedCabin &&
      booking.date === bookingDateStr &&
      booking.shift === selectedShift
    );
    
    if (isAlreadyBooked) {
      toast({
        title: "Cabine indisponível",
        description: "Esta cabine já está reservada para a data e período selecionados.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new booking
    const selectedCabinObj = cabins.find(cabin => cabin.id === selectedCabin);
    const price = selectedCabinObj?.price || 50; // Default price if not set
    
    const newBooking: Booking = {
      id: `${Date.now()}`,
      cabinId: selectedCabin,
      providerId: currentUser.id,
      date: bookingDateStr,
      shift: selectedShift,
      status: "pending",
      price: price,
    };
    
    // Add the new booking
    onSubmitBookings([newBooking]);
    
    toast({
      title: "Reserva solicitada",
      description: "Sua reserva foi solicitada com sucesso e está aguardando confirmação.",
    });
    
    // Reset form and close modal
    setSelectedCabin("");
    setSelectedLocation("");
    setSelectedShift("");
    onClose();
  };
  
  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location ? location.name : "Desconhecido";
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${!open && "hidden"}`}>
        <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>
        <div className="bg-white rounded-lg shadow-lg w-full max-w-lg relative z-50 overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Reservar Cabine</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Localização</label>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma localização" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} - {location.address}, {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedLocation && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cabine</label>
                  <Select
                    value={selectedCabin}
                    onValueChange={setSelectedCabin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma cabine" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCabins.map((cabin) => (
                        <SelectItem key={cabin.id} value={cabin.id}>
                          {cabin.name} - {getLocationName(cabin.locationId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="border rounded-md p-2"
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Período</label>
                <Select
                  value={selectedShift}
                  onValueChange={(value) => setSelectedShift(value as "morning" | "afternoon" | "evening")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Manhã (08:00 - 12:00)</SelectItem>
                    <SelectItem value="afternoon">Tarde (13:00 - 17:00)</SelectItem>
                    <SelectItem value="evening">Noite (18:00 - 22:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleBookCabin}>Reservar</Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default CabinBookingModal;
