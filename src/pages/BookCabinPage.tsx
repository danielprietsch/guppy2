import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Cabin, Location } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCabinSearch } from "@/hooks/useCabinSearch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import BookingCalendar from "@/components/booking/BookingCalendar";
import { TermsOfUseModal } from "@/components/booking/TermsOfUseModal";
import { CabinSearchSection } from "@/components/booking/CabinSearchSection";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { useBookingManagement } from "@/hooks/useBookingManagement";
import { debugBooking, debugBookingError } from "@/utils/debugLogger";

const BookCabinPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { cabinDetails, locationDetails } = location.state || {};
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(cabinDetails || null);
  const [locationData, setLocationData] = useState<Location | null>(locationDetails || null);
  const [loading, setLoading] = useState(true);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const { cabins, isLoading, searchTerm, setSearchTerm } = useCabinSearch(locationData?.id);

  const {
    selectedTurns,
    total,
    subtotalTurns,
    serviceFee,
    bookingInProgress,
    acceptTerms,
    setAcceptTerms,
    handleTurnSelection,
    handleBookCabin,
    setTotal,
    setSubtotalTurns,
    setServiceFee,
    bookingErrors
  } = useBookingManagement(selectedCabin?.id || "", () => setIsTermsModalOpen(false));

  useEffect(() => {
    const loadCabinData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        debugBooking("Loading cabin data for ID:", id);
        
        if (!cabinDetails) {
          const { data: cabinData, error: cabinError } = await supabase
            .from('cabins')
            .select('*')
            .eq('id', id)
            .single();

          if (cabinError) {
            debugBookingError("Error loading cabin data:", cabinError);
            throw cabinError;
          }
          
          debugBooking("Cabin data loaded from database:", cabinData);
          
          let availability = { morning: true, afternoon: true, evening: true };
          if (cabinData.availability && typeof cabinData.availability === 'object') {
            const availObj = cabinData.availability as Record<string, any>;
            availability = {
              morning: availObj.morning === true,
              afternoon: availObj.afternoon === true,
              evening: availObj.evening === true
            };
          }

          let pricing = { defaultPricing: {}, specificDates: {} };
          let price = 50;
          if (cabinData.pricing && typeof cabinData.pricing === 'object') {
            const pricingObj = cabinData.pricing as Record<string, any>;
            pricing = {
              defaultPricing: pricingObj.defaultPricing || {},
              specificDates: pricingObj.specificDates || {}
            };
            price = pricingObj.defaultPrice || 50;
          }
          
          const transformedCabin: Cabin = {
            id: cabinData.id,
            locationId: cabinData.location_id,
            name: cabinData.name,
            description: cabinData.description || '',
            equipment: cabinData.equipment || [],
            imageUrl: cabinData.image_url,
            availability,
            price,
            pricing,
            created_at: cabinData.created_at
          };
          
          debugBooking("Transformed cabin data:", transformedCabin);
          setSelectedCabin(transformedCabin);

          if (cabinData?.location_id) {
            const { data: locData, error: locError } = await supabase
              .from('locations')
              .select('*')
              .eq('id', cabinData.location_id)
              .single();

            if (locError) {
              debugBookingError("Error loading location data:", locError);
              throw locError;
            }
            
            debugBooking("Location data loaded from database:", locData);
            
            let openingHours = { open: "09:00", close: "18:00" };
            if (locData.opening_hours && typeof locData.opening_hours === 'object') {
              const hoursObj = locData.opening_hours as Record<string, any>;
              openingHours = {
                open: hoursObj.open || "09:00",
                close: hoursObj.close || "18:00"
              };
            }
            
            const transformedLocation: Location = {
              id: locData.id,
              name: locData.name,
              address: locData.address,
              city: locData.city,
              state: locData.state,
              zipCode: locData.zip_code,
              cabinsCount: locData.cabins_count || 0,
              openingHours,
              amenities: locData.amenities || [],
              imageUrl: locData.image_url,
              description: locData.description,
              ownerId: locData.owner_id,
              active: locData.active
            };
            
            debugBooking("Transformed location data:", transformedLocation);
            setLocationData(transformedLocation);
          }
        }
      } catch (error) {
        console.error("Error loading cabin data:", error);
        debugBookingError("Failed to load cabin data:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do espaço.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCabinData();
  }, [id, cabinDetails]);

  useEffect(() => {
    if (!selectedCabin) return;

    let calculatedSubtotal = 0;
    Object.entries(selectedTurns).forEach(([date, turns]) => {
      turns.forEach(turn => {
        const turnPrice = selectedCabin.pricing?.defaultPricing?.[turn] || selectedCabin.price || 50;
        calculatedSubtotal += turnPrice;
      });
    });
    
    setSubtotalTurns(calculatedSubtotal);
    const calculatedServiceFee = Object.keys(selectedTurns).length > 0 ? calculatedSubtotal * 0.1 : 0;
    setServiceFee(calculatedServiceFee);
    setTotal(calculatedSubtotal + calculatedServiceFee);
  }, [selectedTurns, selectedCabin, setSubtotalTurns, setServiceFee, setTotal]);

  const handleSelectCabin = (cabin: Cabin) => {
    setSelectedCabin(cabin);
    debugBooking("Selected cabin:", cabin.id);
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-lg">Carregando...</p>
      </div>
    );
  }

  if (!locationData) {
    return (
      <div className="container flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Espaço de Trabalho não encontrado</h2>
          <Button onClick={() => navigate("/locations")}>
            Voltar para Locais
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="space-y-8 max-w-[1200px] mx-auto">
        <CabinSearchSection
          cabins={cabins}
          locationDetails={locationData}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onSelectCabin={handleSelectCabin}
          selectedCabin={selectedCabin}
        />

        {selectedCabin && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Selecione os turnos desejados</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  selectedTurns={selectedTurns}
                  onSelectTurn={handleTurnSelection}
                  pricePerTurn={{
                    morning: selectedCabin.price,
                    afternoon: selectedCabin.price,
                    evening: selectedCabin.price
                  }}
                  workspaceAvailability={selectedCabin.availability}
                  workspaceCreatedAt={selectedCabin.created_at}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo da reserva</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingSummary
                  cabin={selectedCabin}
                  locationData={locationData}
                  selectedTurns={selectedTurns}
                  subtotalTurns={subtotalTurns}
                  serviceFee={serviceFee}
                  total={total}
                  acceptTerms={acceptTerms}
                  setAcceptTerms={setAcceptTerms}
                  onOpenTerms={() => setIsTermsModalOpen(true)}
                  bookingInProgress={bookingInProgress}
                  onBookCabin={handleBookCabin}
                  bookingErrors={bookingErrors}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <TermsOfUseModal 
        isOpen={isTermsModalOpen} 
        onClose={() => setIsTermsModalOpen(false)} 
      />
    </div>
  );
};

export default BookCabinPage;
