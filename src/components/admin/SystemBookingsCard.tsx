
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
        debugLog("SystemBookingsCard: Starting to fetch bookings with improved approach");
        
        // Check if the current user is a global admin from auth metadata first
        const { data: { user } } = await supabase.auth.getUser();
        const userType = user?.user_metadata?.userType;
        
        debugLog(`SystemBookingsCard: User type from metadata: ${userType}`);
        
        if (userType !== 'global_admin') {
          // Double-check with database if metadata doesn't confirm admin status
          debugLog("SystemBookingsCard: User type not found in metadata, checking database");
          const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_global_admin');
          
          if (adminCheckError) {
            debugError(`SystemBookingsCard: Error checking admin status: ${adminCheckError.message}`);
            throw new Error("Error checking admin permissions");
          }
          
          if (!isAdmin) {
            debugError("SystemBookingsCard: User is not a global admin");
            throw new Error("Unauthorized - Only global admins can view all bookings");
          }
          
          debugLog("SystemBookingsCard: User confirmed as admin via database check");
        } else {
          debugLog("SystemBookingsCard: User confirmed as admin via metadata");
        }
        
        // Fetch all bookings now that we've confirmed admin status
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (bookingsError) {
          debugError(`SystemBookingsCard: Error fetching bookings: ${bookingsError.message}`);
          throw bookingsError;
        }
        
        debugLog(`SystemBookingsCard: Successfully fetched ${bookingsData?.length || 0} bookings`);
        
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
        
        debugLog(`SystemBookingsCard: Fetching details for ${professionalIds.length} professionals and ${cabinIds.length} cabins`);
        
        // Get professional names if there are any professional IDs
        const professionalNames: Record<string, string> = {};
        if (professionalIds.length > 0) {
          const { data: professionals, error: profError } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', professionalIds);
            
          if (profError) {
            debugError(`SystemBookingsCard: Error fetching professional names: ${profError.message}`);
          } else if (professionals) {
            professionals.forEach(prof => {
              professionalNames[prof.id] = prof.name || 'Sem nome';
            });
            debugLog(`SystemBookingsCard: Found names for ${professionals.length} professionals`);
          }
        }
        
        // Get cabin names if there are any cabin IDs
        const cabinNames: Record<string, string> = {};
        if (cabinIds.length > 0) {
          const { data: cabins, error: cabinsError } = await supabase
            .from('cabins')
            .select('id, name')
            .in('id', cabinIds);
            
          if (cabinsError) {
            debugError(`SystemBookingsCard: Error fetching cabin names: ${cabinsError.message}`);
          } else if (cabins) {
            cabins.forEach(cabin => {
              cabinNames[cabin.id] = cabin.name || 'Sem nome';
            });
            debugLog(`SystemBookingsCard: Found names for ${cabins.length} cabins`);
          }
        }
        
        // Combine all data
        const processedBookings = bookingsData.map(booking => ({
          ...booking,
          professionalName: booking.professional_id ? professionalNames[booking.professional_id] || 'N/A' : 'N/A',
          cabinName: booking.cabin_id ? cabinNames[booking.cabin_id] || 'N/A' : 'N/A'
        }));
        
        setBookings(processedBookings);
        debugLog(`SystemBookingsCard: Successfully processed ${processedBookings.length} bookings`);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        debugError(`SystemBookingsCard: Error in fetchBookings: ${error}`);
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
