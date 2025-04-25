
import { Cabin, Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const workspaceImages = [
  "https://images.unsplash.com/photo-1633687367233-b9097e506d60?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=800&q=80",
];

interface CabinCardProps {
  cabin: Cabin;
  location?: Location;
}

const CabinCard = ({ cabin, location }: CabinCardProps) => {
  const [isProfessional, setIsProfessional] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkUserType = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        setIsLoggedIn(!!session?.user);
        
        if (session?.user) {
          const userType = session.user.user_metadata?.userType;
          
          if (userType === 'professional' || userType === 'provider') {
            setIsProfessional(true);
            setIsLoading(false);
            return;
          }
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();
          
          if (profile && (profile.user_type === 'professional' || profile.user_type === 'provider')) {
            setIsProfessional(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar tipo de usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserType();
  }, []);

  const imageIndex = parseInt(cabin.id.replace(/\D/g, ""), 10) % workspaceImages.length;
  const workspaceImage = cabin.imageUrl || workspaceImages[imageIndex];

  const formatShiftStatus = (isAvailable: boolean) => {
    return isAvailable ? (
      <span className="text-green-600">Disponível</span>
    ) : (
      <span className="text-red-500">Indisponível</span>
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video overflow-hidden">
        <img
          src={workspaceImage}
          alt={cabin.name}
          className="h-full w-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        {location && (
          <h2 className="text-lg font-bold text-primary mb-2">
            {location.name}
          </h2>
        )}
        <h3 className="font-semibold">
          Espaço: {cabin.name}
        </h3>
        {location && (
          <p className="text-sm text-muted-foreground">
            {location.city}, {location.state}
          </p>
        )}
        <p className="text-sm mt-2">{cabin.description}</p>
        <ul className="mt-2 space-y-1">
          {cabin.equipment.map((item, index) => (
            <li key={index} className="text-xs flex items-center gap-1">
              <span>•</span> {item}
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="font-medium">Manhã</div>
            <div>{formatShiftStatus(cabin.availability.morning)}</div>
          </div>
          <div>
            <div className="font-medium">Tarde</div>
            <div>{formatShiftStatus(cabin.availability.afternoon)}</div>
          </div>
          <div>
            <div className="font-medium">Noite</div>
            <div>{formatShiftStatus(cabin.availability.evening)}</div>
          </div>
        </div>
        {cabin.price && (
          <p className="mt-3 font-semibold">R$ {cabin.price.toFixed(2)}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center w-full">
            Verificando permissões...
          </p>
        ) : !isLoggedIn ? (
          <Link to="/register?type=professional" className="w-full">
            <Button size="sm" variant="outline" className="w-full">
              Cadastre-se para poder reservar um espaço
            </Button>
          </Link>
        ) : isProfessional ? (
          <Link 
            to={`/book-cabin/${cabin.id}?locationId=${location?.id || ''}`} 
            className="w-full" 
            state={{ cabinDetails: cabin, locationDetails: location }}
          >
            <Button size="sm" className="w-full">
              Reservar Espaço
            </Button>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground text-center w-full">
            Apenas profissionais podem reservar espaços
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default CabinCard;
