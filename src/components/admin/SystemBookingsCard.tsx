
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";

interface Booking {
  id: string;
  professional_id: string | null;
  cabin_id: string | null;
  date: string;
  shift: string;
  price: number;
  status: string | null;
  created_at: string;
  professionalName?: string | null;
  cabinName?: string | null;
}

export function SystemBookingsCard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        debugLog("SystemBookingsCard: Iniciando busca de reservas");
        
        // Fetch ALL bookings from the database without any filters
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }

        debugLog(`SystemBookingsCard: Encontradas ${data?.length || 0} reservas`);
        console.log("Dados brutos de reservas:", data);
        
        if (!data || data.length === 0) {
          debugLog("SystemBookingsCard: Nenhuma reserva encontrada");
          setBookings([]);
          return;
        }

        // Get all professional IDs and cabin IDs
        const professionalIds = data
          .filter(booking => booking.professional_id)
          .map(booking => booking.professional_id);
          
        const cabinIds = data
          .filter(booking => booking.cabin_id)
          .map(booking => booking.cabin_id);
          
        debugLog(`SystemBookingsCard: Buscando detalhes para ${professionalIds.length} profissionais e ${cabinIds.length} cabines`);
        
        // Fetch professional names
        let professionalNames: Record<string, string> = {};
        if (professionalIds.length > 0) {
          const { data: professionals } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', professionalIds as string[]);
            
          if (professionals) {
            debugLog(`SystemBookingsCard: Encontrados ${professionals.length} perfis de profissionais`);
            professionals.forEach(prof => {
              professionalNames[prof.id] = prof.name || 'Nome não disponível';
            });
          }
        }
        
        // Fetch cabin names
        let cabinNames: Record<string, string> = {};
        if (cabinIds.length > 0) {
          const { data: cabins } = await supabase
            .from('cabins')
            .select('id, name')
            .in('id', cabinIds as string[]);
            
          if (cabins) {
            debugLog(`SystemBookingsCard: Encontradas ${cabins.length} cabines`);
            cabins.forEach(cabin => {
              cabinNames[cabin.id] = cabin.name || 'Nome não disponível';
            });
          }
        }
        
        // Process bookings with names
        const processedBookings = data.map(booking => ({
          ...booking,
          professionalName: booking.professional_id ? professionalNames[booking.professional_id] || 'Não encontrado' : 'N/A',
          cabinName: booking.cabin_id ? cabinNames[booking.cabin_id] || 'Não encontrada' : 'N/A'
        }));
        
        setBookings(processedBookings);
        debugLog(`SystemBookingsCard: ${processedBookings.length} reservas processadas com sucesso`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        debugError(`SystemBookingsCard: Erro ao buscar reservas: ${errorMessage}`);
        console.error('Erro detalhado:', error);
        toast({
          title: "Erro ao carregar reservas",
          description: "Não foi possível carregar as reservas do sistema.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            Carregando reservas...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservas do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhuma reserva encontrada no sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Cabine</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(new Date(booking.date), "dd 'de' MMMM',' yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="capitalize">{booking.shift}</TableCell>
                    <TableCell>{booking.professionalName}</TableCell>
                    <TableCell>{booking.cabinName}</TableCell>
                    <TableCell>R$ {booking.price.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{booking.status || 'pendente'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
