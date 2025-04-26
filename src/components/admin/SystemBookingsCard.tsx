
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { debugLog, debugError } from "@/utils/debugLogger";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      
      debugLog("SystemBookingsCard: Iniciando busca por reservas...");
      
      // Buscar todas as reservas primeiro
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) {
        debugError(`SystemBookingsCard: Erro ao buscar reservas: ${bookingsError.message}`);
        throw bookingsError;
      }

      debugLog(`SystemBookingsCard: Resposta da API - ${bookingsData ? bookingsData.length : 0} reservas encontradas`);
      
      if (!bookingsData || bookingsData.length === 0) {
        debugLog("SystemBookingsCard: Nenhuma reserva retornada pela API");
        setBookings([]);
        toast({
          title: "Sem reservas",
          description: "Não existem reservas cadastradas no sistema.",
        });
        return;
      }

      // Log para debug de uma das reservas encontradas para conferência
      if (bookingsData.length > 0) {
        debugLog(`SystemBookingsCard: Exemplo de reserva encontrada: ${JSON.stringify(bookingsData[0])}`);
      }

      const processedBookings: Booking[] = [];

      // Processar cada reserva para obter nomes relacionados
      for (const booking of bookingsData) {
        let professionalName = 'Não informado';
        let cabinName = 'Não informada';

        // Buscar nome do profissional se professional_id existir
        if (booking.professional_id) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', booking.professional_id)
              .single();
            
            if (profileError) {
              debugError(`SystemBookingsCard: Erro ao buscar profissional ${booking.professional_id}: ${profileError.message}`);
            } else if (profileData?.name) {
              professionalName = profileData.name;
            }
          } catch (err) {
            debugError(`SystemBookingsCard: Exceção ao buscar profissional: ${err}`);
          }
        }

        // Buscar nome da cabine se cabin_id existir
        if (booking.cabin_id) {
          try {
            const { data: cabinData, error: cabinError } = await supabase
              .from('cabins')
              .select('name')
              .eq('id', booking.cabin_id)
              .single();
            
            if (cabinError) {
              debugError(`SystemBookingsCard: Erro ao buscar cabine ${booking.cabin_id}: ${cabinError.message}`);
            } else if (cabinData?.name) {
              cabinName = cabinData.name;
            }
          } catch (err) {
            debugError(`SystemBookingsCard: Exceção ao buscar cabine: ${err}`);
          }
        }

        processedBookings.push({
          ...booking,
          professionalName,
          cabinName
        });
      }

      debugLog(`SystemBookingsCard: Processou ${processedBookings.length} reservas com sucesso`);
      setBookings(processedBookings);

      if (refreshing) {
        toast({
          title: "Reservas atualizadas",
          description: `${processedBookings.length} reservas carregadas com sucesso.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      debugError(`SystemBookingsCard: ERRO FATAL: ${errorMessage}`);
      setError(`Falha ao carregar reservas: ${errorMessage}`);
      
      toast({
        title: "Erro ao carregar reservas",
        description: "Não foi possível carregar as reservas do sistema. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  // Verificação adicional para debug
  useEffect(() => {
    if (!loading && bookings.length === 0 && !error) {
      debugLog("SystemBookingsCard: Hook useEffect detectou estado carregado com 0 reservas sem erros");
    }
  }, [loading, bookings, error]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reservas do Sistema</CardTitle>
        <Button
          onClick={fetchAllBookings}
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex items-center gap-1"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando reservas...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">
            <p>{error}</p>
            <Button 
              onClick={fetchAllBookings}
              className="mt-4"
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>Nenhuma reserva encontrada no sistema.</p>
            <p className="text-sm mt-2">
              (Verifique os logs de console para detalhes do problema)
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
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
                    <TableCell className="font-mono text-xs">
                      {booking.id}
                    </TableCell>
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
