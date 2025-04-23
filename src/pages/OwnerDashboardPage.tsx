
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Location, Cabin } from "@/lib/types";
import { users, locations, cabins } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

// Import components
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { LocationsOverview } from "@/components/owner/LocationsOverview";
import { PricingSettings } from "@/components/owner/PricingSettings";
import { EquipmentSettings } from "@/components/owner/EquipmentSettings";
import { AvailabilitySettings } from "@/components/owner/AvailabilitySettings";
import { LocationSettings } from "@/components/owner/LocationSettings";

const OwnerDashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState("locations");
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationCabins, setLocationCabins] = useState<Cabin[]>([]);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("currentUser");
    
    if (!storedUser) {
      navigate("/login");
      return;
    }
    
    try {
      const user = JSON.parse(storedUser) as User;
      
      // Check if user is owner type
      if (user.userType !== "owner") {
        navigate("/");
        toast({
          title: "Acesso restrito",
          description: "Você não tem permissão para acessar esta página.",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentUser(user);
      
      // Get owned locations
      const ownedLocations = locations.filter((location) => 
        user.ownedLocationIds?.includes(location.id)
      );
      
      setUserLocations(ownedLocations);
      
      // Set default selected location if there are any
      if (ownedLocations.length > 0) {
        setSelectedLocation(ownedLocations[0]);
        
        // Get cabins for selected location
        const locationCabins = cabins.filter(
          (cabin) => cabin.locationId === ownedLocations[0].id
        );
        
        setLocationCabins(locationCabins);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("currentUser");
      navigate("/login");
    }
  }, [navigate]);

  const handleLocationChange = (locationId: string) => {
    const location = locations.find((loc) => loc.id === locationId);
    if (location) {
      setSelectedLocation(location);
      
      // Get cabins for selected location
      const locCabins = cabins.filter((cabin) => cabin.locationId === locationId);
      setLocationCabins(locCabins);
    }
  };

  if (!currentUser) {
    return (
      <div className="container py-12">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2">Portal do Franqueado</h1>
      <p className="text-muted-foreground mb-8">
        Gerencie seus locais, cabines e preços
      </p>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <OwnerSidebar 
          userLocations={userLocations}
          selectedLocation={selectedLocation}
          onLocationChange={handleLocationChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === "locations" && (
            <LocationsOverview selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}

          {activeTab === "pricing" && (
            <PricingSettings selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}
          
          {activeTab === "equipment" && (
            <EquipmentSettings selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}

          {activeTab === "availability" && (
            <AvailabilitySettings selectedLocation={selectedLocation} locationCabins={locationCabins} />
          )}

          {activeTab === "settings" && (
            <LocationSettings selectedLocation={selectedLocation} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboardPage;
