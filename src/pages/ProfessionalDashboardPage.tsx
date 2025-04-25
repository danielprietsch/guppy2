import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  Scissors,
  DollarSign,
  Star,
  PieChart,
  Loader2,
} from "lucide-react";
import { services, appointments, reviews } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { useServices } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import ServiceEditCard from "@/components/ServiceEditCard";
import PrivacySettingsCard from "@/components/professional/PrivacySettingsCard";
import AvailabilityCalendar from "@/components/professional/AvailabilityCalendar";
import WorkingHoursSettings from "@/components/professional/WorkingHoursSettings";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ProfessionalDashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const { services, loading: servicesLoading, refetch: refetchServices } = useServices();
  const [isPublicProfile, setIsPublicProfile] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Stats data
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalClients: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Loading timeout reached, forcing dashboard display");
        setLoading(false);
        setLoadingError("Timeout ao carregar dados. Alguns dados podem não estar disponíveis.");
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfileAndData = async () => {
      try {
        if (!user) {
          console.log("No user found, aborting fetch");
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        console.log("Fetching user profile for:", user.id);
        
        // Fetch user profile to get privacy settings
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser && authUser.user_metadata) {
            const isPublic = authUser.user_metadata.isPublic !== false; // Default to public if not set
            if (isMounted) {
              setIsPublicProfile(isPublic);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Continue anyway to show the dashboard
        }
        
        // Simulate loading behavior with mock data
        // In a real app, this would fetch data from API based on current user
        if (isMounted) {
          const professionalAppointments = appointments.filter(
            (app) => app.professionalId === user.id
          );
          const professionalReviews = reviews.filter(
            (review) => review.professionalId === user.id
          );

          // Calculate relevant statistics
          const uniqueClients = [...new Set(professionalAppointments.map((app) => app.clientId))];
          const totalRevenue = professionalAppointments.reduce((sum, app) => sum + app.price, 0);

          let avgRating = 0;
          if (professionalReviews.length > 0) {
            avgRating = professionalReviews.reduce((sum, review) => sum + review.rating, 0) /
              professionalReviews.length;
          }

          setStats({
            upcomingAppointments: professionalAppointments.filter(
              (app) => app.status === "confirmed"
            ).length,
            totalClients: uniqueClients.length,
            totalRevenue: totalRevenue,
            averageRating: avgRating,
          });
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        if (isMounted) {
          setLoadingError("Erro ao carregar dados do dashboard");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUserProfileAndData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;
      
      setBookingsLoading(true);
      try {
        console.log("Fetching bookings for professional:", user.id);
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            cabin:cabins (
              name,
              location:locations (
                name
              )
            )
          `)
          .eq('professional_id', user.id);

        if (error) {
          console.error("Error fetching bookings:", error);
          throw error;
        }
        
        console.log("Bookings data fetched:", data);
        setUserBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar suas reservas.",
          variant: "destructive",
        });
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id]);

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

  const getStatusText = (status: string) => {
    switch (status) {
      case "payment_pending":
        return "Aguardando Pagamento";
      case "confirmed":
        return "Confirmada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "text-green-600";
    case "payment_pending":
      return "text-amber-600";
    case "cancelled":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

  // If there's a loading error, show it and display the dashboard anyway
  if (loadingError) {
    toast({
      title: "Aviso",
      description: loadingError,
      variant: "destructive",
    });
  }

  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-lg">Carregando informações do dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Profissional</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus agendamentos, serviços e aluguel de cabines
          </p>
        </div>
        <Button asChild>
          <Link to="/services/new">Adicionar Novo Serviço</Link>
        </Button>
      </div>

      <PrivacySettingsCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Agendamentos
                </p>
                <h2 className="text-3xl font-bold">{stats.upcomingAppointments}</h2>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Clientes
                </p>
                <h2 className="text-3xl font-bold">{stats.totalClients}</h2>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita</p>
                <h2 className="text-3xl font-bold">R$ {stats.totalRevenue}</h2>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avaliação
                </p>
                <h2 className="text-3xl font-bold flex items-center">
                  {stats.averageRating.toFixed(1)}
                  <Star className="h-5 w-5 ml-1 fill-yellow-400 text-yellow-400 inline" />
                </h2>
              </div>
              <Star className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="availability">Disponibilidade</TabsTrigger>
          <TabsTrigger value="working-hours">Horários de Trabalho</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="services">Meus Serviços</TabsTrigger>
          <TabsTrigger value="bookings">Reservas de Cabine</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <AvailabilityCalendar />
        </TabsContent>
        
        <TabsContent value="working-hours" className="space-y-4">
          <WorkingHoursSettings />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Próximos Agendamentos</span>
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Calendário
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appointments
                  .filter(
                    (app) => app.professionalId === user?.id && app.status === "confirmed"
                  )
                  .slice(0, 3)
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex justify-between items-center border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">Cliente #{appointment.clientId}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {appointment.date}
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          {appointment.time}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">R$ {appointment.price}</p>
                        <p className="text-sm text-right text-muted-foreground">
                          Serviço #{appointment.serviceId}
                        </p>
                      </div>
                    </div>
                  ))}

                {appointments.filter(
                  (app) => app.professionalId === user?.id && app.status === "confirmed"
                ).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Você não tem agendamentos confirmados
                  </div>
                )}
              </div>

              {appointments.filter(
                (app) => app.professionalId === user?.id && app.status === "confirmed"
              ).length > 0 && (
                <Button variant="ghost" className="w-full mt-4">
                  Ver todos os agendamentos
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Meus Serviços</span>
                <Button asChild variant="default">
                  <Link to="/services/new">Adicionar Novo Serviço</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando seus serviços...</p>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    Você ainda não cadastrou nenhum serviço.
                  </p>
                  <Button asChild>
                    <Link to="/services/new">Adicionar Primeiro Serviço</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {services.map((service) => (
                    <ServiceEditCard
                      key={service.id}
                      service={service}
                      onServiceUpdated={refetchServices}
                      onServiceDeleted={refetchServices}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reservas de Cabine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookingsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Você não tem reservas de cabine.
                  </div>
                ) : (
                  userBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex justify-between items-center border-b pb-4"
                    >
                      <div>
                        <p className="font-medium">{booking.cabin?.location?.name || 'Local não encontrado'}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.cabin?.name || 'Cabine não encontrada'}
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(booking.date), "dd/MM/yyyy")}
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          {getShiftText(booking.shift)}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {booking.price.toFixed(2).replace('.', ',')}
                        </p>
                        <p className={`text-sm ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Avaliações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews
                  .filter((review) => review.professionalId === user?.id)
                  .map((review) => (
                    <div key={review.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={`h-4 w-4 ${
                                index < review.rating
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {review.date}
                        </span>
                      </div>
                      <p>{review.comment}</p>
                    </div>
                  ))}

                {reviews.filter((review) => review.professionalId === user?.id).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    Você não tem avaliações.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfessionalDashboardPage;
