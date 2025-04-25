import { Cabin, Location } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cabinImages = [
  "https://images.unsplash.com/photo-1633687367233-b9097e506d60?auto=format&fit=crop&w=800&q=80", // Hair salon station
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80", // Salon chair and mirror
  "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=80", // Modern beauty workspace
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80", // Elegant salon interior
  "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=800&q=80", // Professional salon setup
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
        // Verificar se há uma sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        
        setIsLoggedIn(!!session?.user);
        
        if (session?.user) {
          // Verificar primeiro nos metadados do usuário (mais confiável)
          const userType = session.user.user_metadata?.userType;
          
          if (userType === 'professional' || userType === 'provider') {
            setIsProfessional(true);
            setIsLoading(false);
            return;
          }
          
          // Se não houver nos metadados, verificar na tabela de perfis
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

  const imageIndex = parseInt(cabin.id.replace(/\D/g, ""), 10) % cabinImages.length;
  const cabinImage = cabin.imageUrl || cabinImages[imageIndex];

  const formatShiftStatus = (isAvailable: boolean) => {
    return isAvailable ? (
      <span className="text-green-600">Disponível</span>
    ) : (
      <span className="text-red-500">Indisponível</span>
    );
  };

  const getCabinCalendarUrl = () => {
    // Incluir tanto o ID da cabine quanto da localização (se disponível)
    const params = new URLSearchParams();
    params.append("cabin", cabin.id);
    if (location) {
      params.append("location", location.id);
    }
    
    return `/professional/calendar?${params.toString()}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video overflow-hidden">
        <img
          src={cabinImage}
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
          Cabine: {cabin.name}
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
              Cadastre-se para poder reservar uma cabine
            </Button>
          </Link>
        ) : isProfessional ? (
          <Link to={getCabinCalendarUrl()} className="w-full">
            <Button size="sm" className="w-full">
              Reservar Cabine
            </Button>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground text-center w-full">
            Apenas profissionais podem reservar cabines
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default CabinCard;
