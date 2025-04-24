
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Location, Cabin } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CabinCard from "@/components/CabinCard";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const LocationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null>(null);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [userType, setUserType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocationAndCabins = async () => {
      try {
        // Check current user's type
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();
          
          setUserType(profile?.user_type || null);
        }

        // Fetch location details
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', id)
          .single();

        if (locationError) throw locationError;

        // Transform the data to match our Location interface
        const transformedLocation: Location = {
          id: locationData.id,
          name: locationData.name,
          address: locationData.address,
          city: locationData.city,
          state: locationData.state,
          zipCode: locationData.zip_code,
          cabinsCount: locationData.cabins_count || 0,
          openingHours: locationData.opening_hours 
            ? (typeof locationData.opening_hours === 'string' 
                ? JSON.parse(locationData.opening_hours) 
                : locationData.opening_hours)
            : { open: "09:00", close: "18:00" },
          amenities: locationData.amenities || [],
          imageUrl: locationData.image_url || "",
          description: locationData.description,
          active: locationData.active,
          ownerId: locationData.owner_id
        };

        setLocation(transformedLocation);

        // Fetch cabins for this location
        const { data: cabinsData, error: cabinsError } = await supabase
          .from('cabins')
          .select('*')
          .eq('location_id', id);

        if (cabinsError) throw cabinsError;

        // Transform the data to match our Cabin interface
        const transformedCabins: Cabin[] = (cabinsData || []).map(cabin => {
          // Parse availability or set defaults
          const availability = cabin.availability 
            ? (typeof cabin.availability === 'string' 
                ? JSON.parse(cabin.availability) 
                : cabin.availability)
            : { morning: true, afternoon: true, evening: true };

          // Parse pricing or set defaults
          const pricing = cabin.pricing 
            ? (typeof cabin.pricing === 'string' 
                ? JSON.parse(cabin.pricing) 
                : cabin.pricing)
            : { defaultPricing: {} };

          return {
            id: cabin.id,
            locationId: cabin.location_id,
            name: cabin.name,
            description: cabin.description || "",
            equipment: cabin.equipment || [],
            imageUrl: cabin.image_url || "",
            availability: availability,
            price: 0,
            pricing: pricing
          };
        });

        setCabins(transformedCabins);
      } catch (error) {
        console.error("Error fetching location details:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da localização",
          variant: "destructive"
        });
        navigate("/locations");
      } finally {
        setLoading(false);
      }
    };

    fetchLocationAndCabins();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <p>Carregando detalhes da localização...</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="container py-12">
        <p>Localização não encontrada</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{location.name}</h1>
        <p className="text-muted-foreground mt-2">{location.address}</p>
      </div>

      {userType === 'professional' && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Reservar Cabines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Como profissional, você pode reservar cabines nesta localização.
              </p>
              <Button 
                onClick={() => navigate(`/book-cabin/${cabins[0]?.id}`)}
                disabled={cabins.length === 0}
              >
                Reservar Cabine
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cabins.map(cabin => (
          <CabinCard 
            key={cabin.id} 
            cabin={cabin} 
            location={location} 
          />
        ))}
      </div>
    </div>
  );
};

export default LocationDetailPage;
