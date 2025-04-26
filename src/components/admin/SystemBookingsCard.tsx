
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

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      setRefreshing(true);
      debugLog("SystemBookingsCard: INICIANDO BUSCA COMO ADMINISTRADOR GLOBAL");
      console.log("Buscando todas as reservas com permissões de administrador...");
      
      // Solução radical: Forçar a consulta como administrador sem verificar permissão via função RPC
      // Primeiro, obter a sessão atual para confirmar que estamos autenticados
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não há sessão ativa. Faça login novamente.");
      }
      
      // Consultar reservas diretamente
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("ERRO AO BUSCAR RESERVAS:", error);
        debugError(`SystemBookingsCard: ERRO CRÍTICO NA CONSULTA: ${error.message}`);
        throw error;
      }

      console.log("DADOS DE RESERVAS RECEBIDOS:", data);
      debugLog(`SystemBookingsCard: ${data?.length || 0} RESERVAS ENCONTRADAS NO BANCO`);

      if (!data || data.length === 0) {
        debugLog("SystemBookingsCard: Nenhuma reserva encontrada no banco de dados");
        setBookings([]);
        
        toast({
          title: "Sem reservas",
          description: "Não existem reservas cadastradas no sistema.",
        });
        return;
      }

      const professionalIds = data
        .filter(booking => booking.professional_id)
        .map(booking => booking.professional_id);
        
      const cabinIds = data
        .filter(booking => booking.cabin_id)
        .map(booking => booking.cabin_id);
      
      debugLog(`SystemBookingsCard: Buscando detalhes para ${professionalIds.length} profissionais e ${cabinIds.length} cabines`);
      
      let professionalNames: Record<string, string> = {};
      let cabinNames: Record<string, string> = {};
      
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
        }
      }
      
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
        }
      }
      
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
      
      if (refreshing) {
        toast({
          title: "Reservas atualizadas",
          description: `${processedBookings.length} reservas carregadas com sucesso.`,
        });
      }
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
      setRefreshing(false);
    }
  };

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
