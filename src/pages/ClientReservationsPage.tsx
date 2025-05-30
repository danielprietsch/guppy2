
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

interface Reservation {
  id: string;
  date: string;
  shift: string;
  status: string;
  price: number;
  cabin: {
    name: string;
    location: {
      name: string;
    }
  }
}

const ClientReservationsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

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

        // Fetch reservations with cabin and location details
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            date,
            shift,
            status,
            price,
            cabin:cabins (
              name,
              location:locations (
                name
              )
            )
          `)
          .eq('professional_id', session.user.id)
          .order('date', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setReservations(data as Reservation[]);
        }

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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

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
          onClick={() => navigate("/client/dashboard")}
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>{reservation.cabin?.location?.name || 'N/A'}</TableCell>
                    <TableCell>{reservation.cabin?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(reservation.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{getShiftText(reservation.shift)}</TableCell>
                    <TableCell>R$ {reservation.price.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(reservation.status)}`}>
                        {getStatusText(reservation.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={reservation.status === "cancelled"}
                        className="text-xs"
                        onClick={() => {
                          toast({
                            title: "Funcionalidade em desenvolvimento",
                            description: "O cancelamento de reservas estará disponível em breve.",
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
              Você ainda não possui nenhuma reserva. Explore nossos profissionais e faça seu agendamento.
            </p>
            <Button
              onClick={() => navigate("/locations")}
              className="mt-4"
            >
              Descobrir Espaços
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientReservationsPage;
