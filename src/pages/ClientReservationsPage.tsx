
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { debugLog, debugError } from "@/utils/debugLogger";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Booking, Location, Cabin } from "@/lib/types";

const ClientReservationsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        debugLog("Fetching client reservations");

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        // Use direct query instead of a join that might trigger RLS recursion
        // First fetch all bookings for the current professional
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('professional_id', session.user.id)
          .eq('status', 'confirmed');

        if (bookingsError) {
          debugError("Error fetching bookings:", bookingsError);
          throw bookingsError;
        }

        if (!bookingsData || bookingsData.length === 0) {
          debugLog("No reservations found");
          setReservations([]);
          setLoading(false);
          return;
        }

        // Then fetch cabin information for each booking
        const bookingsWithDetails = await Promise.all(
          bookingsData.map(async (booking) => {
            // Get cabin details
            const { data: cabinData } = await supabase
              .from('cabins')
              .select('name, location_id')
              .eq('id', booking.cabin_id)
              .single();

            let locationName = "Local não encontrado";
            let locationAddress = "";
            let locationCity = "";
            let locationState = "";

            // If cabin was found, get location details
            if (cabinData) {
              const { data: locationData } = await supabase
                .from('locations')
                .select('name, address, city, state')
                .eq('id', cabinData.location_id)
                .single();

              if (locationData) {
                locationName = locationData.name;
                locationAddress = locationData.address;
                locationCity = locationData.city;
                locationState = locationData.state;
              }
            }

            // Return booking with additional details
            return {
              ...booking,
              cabin: {
                name: cabinData?.name || "Cabine não encontrada",
                location: {
                  name: locationName,
                  address: locationAddress,
                  city: locationCity,
                  state: locationState
                }
              }
            };
          })
        );

        debugLog("Fetched reservations with details:", bookingsWithDetails);
        setReservations(bookingsWithDetails);

      } catch (error) {
        debugError("Error fetching reservations:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas reservas.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [navigate]);

  const getShiftText = (shift: string) => {
    switch (shift) {
      case "morning":
        return "Manhã";
      case "afternoon":
        return "Tarde";
      case "evening":
        return "Noite";
      default:
        return shift;
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
            <p className="text-muted-foreground">Buscando suas reservas, por favor aguarde.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Minhas Reservas</h1>
          <p className="mt-1 text-gray-500">
            Gerencie suas reservas e agendamentos
          </p>
        </div>
        <Button
          onClick={() => navigate("/professional/dashboard")}
          variant="outline"
        >
          Voltar ao Dashboard
        </Button>
      </div>

      {reservations.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Local</TableHead>
                  <TableHead>Cabine</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      {reservation.cabin?.location?.name || "Local não encontrado"}
                    </TableCell>
                    <TableCell>{reservation.cabin?.name || "Cabine não encontrada"}</TableCell>
                    <TableCell>
                      {format(new Date(reservation.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getShiftText(reservation.shift)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirmada
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          // In the future, this could show more details or allow cancellation
                          toast({
                            title: "Detalhes da reserva",
                            description: `Reserva para ${format(new Date(reservation.date), "dd/MM/yyyy", { locale: ptBR })} - ${getShiftText(reservation.shift)}`,
                          });
                        }}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma reserva encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você ainda não possui nenhuma reserva. Explore nossos espaços e faça seu agendamento.
            </p>
            <Button
              onClick={() => navigate("/search-cabins")}
              className="mt-4"
            >
              Procurar Cabines
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientReservationsPage;
