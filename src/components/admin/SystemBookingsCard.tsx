
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Function to force refresh data
  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      debugLog("SystemBookingsCard: INICIANDO BUSCA DIRETA DE TODAS AS RESERVAS");
      console.log("Tentando buscar todas as reservas do sistema...");
      
      // Direct raw query to get ALL bookings with no filters
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("ERRO AO BUSCAR RESERVAS:", error);
        debugError(`SystemBookingsCard: ERRO CRÍTICO NA CONSULTA: ${error.message}`);
        throw error;
      }

      // Log raw data for inspection
      console.log("RAW BOOKING DATA RECEBIDO:", data);
      debugLog(`SystemBookingsCard: ${data?.length || 0} RESERVAS ENCONTRADAS NO BANCO`);

      if (!data || data.length === 0) {
        debugLog("SystemBookingsCard: NENHUMA RESERVA NA TABELA BOOKINGS");
        setBookings([]);
        setLoading(false);
        return;
      }

      // Get all professional IDs
      const professionalIds = data
        .filter(booking => booking.professional_id)
        .map(booking => booking.professional_id);
        
      // Get all cabin IDs
      const cabinIds = data
        .filter(booking => booking.cabin_id)
        .map(booking => booking.cabin_id);
        
      debugLog(`SystemBookingsCard: Buscando detalhes para ${professionalIds.length} profissionais e ${cabinIds.length} cabines`);
      
      // Create maps for names
      let professionalNames: Record<string, string> = {};
      let cabinNames: Record<string, string> = {};
      
      // Fetch professional names if there are any professional IDs
      if (professionalIds.length > 0) {
        try {
          const { data: professionals, error: profError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', professionalIds as string[]);
            
          if (profError) {
            console.error("ERRO AO BUSCAR PROFISSIONAIS:", profError);
            debugError(`SystemBookingsCard: Erro ao buscar profissionais: ${profError.message}`);
          } else if (professionals) {
            debugLog(`SystemBookingsCard: ${professionals.length} perfis de profissionais encontrados`);
            professionals.forEach(prof => {
              professionalNames[prof.id] = prof.name || 'Nome não disponível';
            });
          }
        } catch (e) {
          console.error("EXCEÇÃO AO BUSCAR PROFISSIONAIS:", e);
          // Continue processing even if we can't get professional names
        }
      }
      
      // Fetch cabin names if there are any cabin IDs
      if (cabinIds.length > 0) {
        try {
          const { data: cabins, error: cabinError } = await supabase
            .from('cabins')
            .select('id, name')
            .in('id', cabinIds as string[]);
            
          if (cabinError) {
            console.error("ERRO AO BUSCAR CABINES:", cabinError);
            debugError(`SystemBookingsCard: Erro ao buscar cabines: ${cabinError.message}`);
          } else if (cabins) {
            debugLog(`SystemBookingsCard: ${cabins.length} cabines encontradas`);
            cabins.forEach(cabin => {
              cabinNames[cabin.id] = cabin.name || 'Nome não disponível';
            });
          }
        } catch (e) {
          console.error("EXCEÇÃO AO BUSCAR CABINES:", e);
          // Continue processing even if we can't get cabin names
        }
      }
      
      // Process bookings and add names
      const processedBookings = data.map(booking => ({
        ...booking,
        professionalName: booking.professional_id ? 
          (professionalNames[booking.professional_id] || 'Profissional ID: ' + booking.professional_id) : 
          'Não informado',
        cabinName: booking.cabin_id ? 
          (cabinNames[booking.cabin_id] || 'Cabine ID: ' + booking.cabin_id) : 
          'Não informada'
      }));
      
      debugLog(`SystemBookingsCard: Processadas ${processedBookings.length} reservas com sucesso`);
      console.log("RESERVAS PROCESSADAS:", processedBookings);
      
      setBookings(processedBookings);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      debugError(`SystemBookingsCard: ERRO FATAL: ${errorMessage}`);
      console.error('ERRO DETALHADO NA BUSCA DE RESERVAS:', error);
      setError(`Falha ao carregar reservas: ${errorMessage}`);
      
      toast({
        title: "Erro ao carregar reservas",
        description: "Não foi possível carregar as reservas do sistema. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
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

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-red-500">
            <p>{error}</p>
            <button 
              onClick={fetchAllBookings}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Tentar Novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reservas do Sistema</CardTitle>
        <button
          onClick={fetchAllBookings}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Atualizar
        </button>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhuma reserva encontrada no sistema.</p>
            <p className="mt-2 text-sm text-red-500">
              Verifique se existem registros na tabela 'bookings' no banco de dados.
            </p>
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
