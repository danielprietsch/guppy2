
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
        debugLog("SystemBookingsCard: Fetching bookings for global admin");
        // Check session exists
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          debugError("SystemBookingsCard: No session found");
          throw new Error("No session found");
        }

        // Try multiple approaches to verify admin status to ensure we don't get stuck
        // in permission issues - this offers more reliable authentication
        
        // Approach 1: Check user metadata first (fastest and most reliable)
        const userMetadata = session.user.user_metadata;
        const userTypeFromMetadata = userMetadata?.userType;
        
        debugLog(`SystemBookingsCard: User type from metadata: ${userTypeFromMetadata}`);
        
        let isAdmin = userTypeFromMetadata === "global_admin";
        
        // Approach 2: If not in metadata, use RPC function
        if (!isAdmin) {
          debugLog("SystemBookingsCard: Checking admin status using RPC function");
          const { data: rpcResult, error: rpcError } = await supabase.rpc('is_global_admin', {
            user_id: session.user.id
          });
          
          if (rpcError) {
            debugError(`SystemBookingsCard: RPC error: ${rpcError.message}`);
          } else {
            isAdmin = !!rpcResult;
            debugLog(`SystemBookingsCard: RPC result: ${isAdmin}`);
          }
        }

        // Approach 3: Direct query as last resort
        if (!isAdmin) {
          debugLog("SystemBookingsCard: Checking admin status via direct query");
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();
            
          if (!profileError && profileData) {
            isAdmin = profileData.user_type === 'global_admin';
            debugLog(`SystemBookingsCard: Profile query result: ${isAdmin}`);
          } else if (profileError) {
            debugError(`SystemBookingsCard: Profile query error: ${profileError.message}`);
          }
        }

        // If after all checks, still not admin, throw error
        if (!isAdmin) {
          debugError("SystemBookingsCard: User is not a global admin");
          throw new Error("Unauthorized - Only global admins can view all bookings");
        }

        debugLog("SystemBookingsCard: User is confirmed as global admin, fetching bookings");
        
        // If user is admin, fetch all bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;
        
        if (!bookingsData || bookingsData.length === 0) {
          setBookings([]);
          setLoading(false);
          return;
        }
        
        // Create a map of professional IDs to fetch their names separately
        const professionalIds = bookingsData
          .map(booking => booking.professional_id)
          .filter(id => id !== null) as string[];
          
        // Create a map of cabin IDs to fetch their names separately  
        const cabinIds = bookingsData
          .map(booking => booking.cabin_id)
          .filter(id => id !== null) as string[];
        
        // Get professional names if there are any professional IDs
        const professionalNames: Record<string, string> = {};
        if (professionalIds.length > 0) {
          const { data: professionals, error: profError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', professionalIds);
            
          if (!profError && professionals) {
            professionals.forEach(prof => {
              professionalNames[prof.id] = prof.name || 'Sem nome';
            });
          }
        }
        
        // Get cabin names if there are any cabin IDs
        const cabinNames: Record<string, string> = {};
        if (cabinIds.length > 0) {
          const { data: cabins, error: cabinsError } = await supabase
            .from('cabins')
            .select('id, name')
            .in('id', cabinIds);
            
          if (!cabinsError && cabins) {
            cabins.forEach(cabin => {
              cabinNames[cabin.id] = cabin.name || 'Sem nome';
            });
          }
        }
        
        // Combine all data
        const processedBookings = bookingsData.map(booking => ({
          ...booking,
          professionalName: booking.professional_id ? professionalNames[booking.professional_id] || 'N/A' : 'N/A',
          cabinName: booking.cabin_id ? cabinNames[booking.cabin_id] || 'N/A' : 'N/A'
        }));
        
        setBookings(processedBookings);
        debugLog(`SystemBookingsCard: Successfully loaded ${processedBookings.length} bookings`);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        debugError(`SystemBookingsCard: Error fetching bookings: ${error}`);
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
