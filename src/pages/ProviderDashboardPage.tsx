import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Booking, Appointment, Service } from "@/lib/types";
import { bookings, appointments, services, cabins, locations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Calendar, Clock, DollarSign, Plus, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import CabinAvailabilityCalendar from "@/components/CabinAvailabilityCalendar";
import CabinBookingModal from "@/components/CabinBookingModal";

import { users } from "@/lib/mock-data";

const ProviderDashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [providerBookings, setProviderBookings] = useState<Booking[]>([]);
  const [providerAppointments, setProviderAppointments] = useState<Appointment[]>([]);
  const [providerServices, setProviderServices] = useState<Service[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: "",
    description: "",
    duration: 30,
    price: 0,
    category: "",
  });
  const [modalReserveOpen, setModalReserveOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedUser) {
      const user = JSON.parse(storedUser) as User;
      
      if (user.userType !== "provider") {
        toast({
          title: "Acesso negado",
          description: "Esta página é apenas para prestadores de serviço.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      
      setCurrentUser(user);
      
      const userBookings = bookings.filter(
        (booking) => booking.providerId === user.id
      );
      setProviderBookings(userBookings);
      
      const userAppointments = appointments.filter(
        (appointment) => appointment.providerId === user.id
      );
      setProviderAppointments(userAppointments);
      
      const userServices = services.filter(
        (service) => service.providerId === user.id
      );
      setProviderServices(userServices);
    } else {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [navigate]);

  const getCabinInfo = (cabinId: string) => {
    const cabin = cabins.find((cabin) => cabin.id === cabinId);
    if (!cabin) return { name: "Desconhecido", location: "Desconhecido" };
    
    const location = locations.find((loc) => loc.id === cabin.locationId);
    return {
      name: cabin.name,
      location: location ? location.name : "Desconhecido",
    };
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("pt-BR", options);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
    navigate("/login");
  };

  const handleAddService = () => {
    if (!currentUser) return;
    
    if (!newService.name || !newService.price) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos o nome e o preço do serviço.",
        variant: "destructive",
      });
      return;
    }
    
    const service: Service = {
      id: `${services.length + 1}`,
      providerId: currentUser.id,
      name: newService.name || "",
      description: newService.description || "",
      duration: newService.duration || 30,
      price: newService.price || 0,
      category: newService.category || "Outros",
    };
    
    setProviderServices([...providerServices, service]);
    
    toast({
      title: "Serviço adicionado",
      description: "O serviço foi adicionado com sucesso.",
    });
    
    setNewService({
      name: "",
      description: "",
      duration: 30,
      price: 0,
      category: "",
    });
    setIsAddingService(false);
  };

  const handleAddBookingsFromModal = (newBookings: Booking[]) => {
    setProviderBookings((prev) => [...prev, ...newBookings]);
  };

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {currentUser.name}</h1>
          <p className="mt-1 text-gray-500">
            Bem-vindo ao seu painel de controle de prestador
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-center">Reservas de Cabines</h3>
            <div className="mt-2 text-3xl font-bold">{providerBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-center">Agendamentos de Clientes</h3>
            <div className="mt-2 text-3xl font-bold">{providerAppointments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-center">Faturamento do Mês</h3>
            <div className="mt-2 text-3xl font-bold">
              R$ {(
                providerAppointments.reduce(
                  (sum, appointment) => sum + appointment.price,
                  0
                ) || 0
              ).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="bookings">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="bookings">Minhas Reservas</TabsTrigger>
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="services">Meus Serviços</TabsTrigger>
            <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bookings">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Minhas Reservas de Cabines</CardTitle>
                <Button
                  onClick={() => setModalReserveOpen(true)}
                  variant="default"
                >
                  Reservar Nova Cabine
                </Button>
              </CardHeader>
              <CardContent>
                <CabinBookingModal
                  open={modalReserveOpen}
                  onClose={() => setModalReserveOpen(false)}
                  currentUser={currentUser}
                  providerBookings={providerBookings}
                  onSubmitBookings={handleAddBookingsFromModal}
                />
                {providerBookings.length > 0 ? (
                  <div className="space-y-4">
                    {providerBookings.map((booking) => {
                      const cabinInfo = getCabinInfo(booking.cabinId);
                      return (
                        <div
                          key={booking.id}
                          className="rounded-lg border p-4 grid md:grid-cols-[1fr_auto]"
                        >
                          <div>
                            <div className="font-medium">
                              {cabinInfo.name} - {cabinInfo.location}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(booking.date)}</span>
                            </div>
                            <div className="mt-0.5 text-sm text-gray-500">
                              Turno: {booking.shift === "morning" ? "Manhã" : booking.shift === "afternoon" ? "Tarde" : "Noite"}
                            </div>
                            <div
                              className={`mt-2 text-xs ${
                                booking.status === "confirmed"
                                  ? "text-green-600"
                                  : booking.status === "pending"
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {booking.status === "confirmed"
                                ? "Confirmado"
                                : booking.status === "pending"
                                ? "Pendente"
                                : "Cancelado"}
                            </div>
                          </div>
                          <div className="text-right md:flex md:flex-col md:justify-center">
                            <div className="font-medium">
                              R$ {booking.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-medium">Nenhuma reserva encontrada</h3>
                    <p className="mt-1 text-gray-500">
                      Você ainda não fez nenhuma reserva de cabine.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => setModalReserveOpen(true)}
                    >
                      Reservar Cabine
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appointments">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {providerAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {providerAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-lg border p-4 grid md:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <div className="font-medium">
                            Cliente: {users.find((user) => user.id === appointment.clientId)?.name || "Desconhecido"}
                          </div>
                          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(appointment.date)}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div
                            className={`mt-2 text-xs ${
                              appointment.status === "confirmed"
                                ? "text-green-600"
                                : appointment.status === "pending"
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {appointment.status === "confirmed"
                              ? "Confirmado"
                              : appointment.status === "pending"
                              ? "Pendente"
                              : "Cancelado"}
                          </div>
                        </div>
                        <div className="text-right md:flex md:flex-col md:justify-center">
                          <div className="font-medium">
                            R$ {appointment.price.toFixed(2)}
                          </div>
                          <div className="mt-2 flex gap-2 justify-end">
                            <Button size="sm" variant="outline">
                              Reagendar
                            </Button>
                            <Button size="sm" variant="destructive">
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-medium">Nenhum agendamento encontrado</h3>
                    <p className="mt-1 text-gray-500">
                      Você ainda não possui nenhum agendamento de clientes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Meus Serviços</CardTitle>
                <Button onClick={() => setIsAddingService(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardHeader>
              <CardContent>
                {isAddingService ? (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-4">Novo Serviço</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome do Serviço *</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border p-2"
                          value={newService.name}
                          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Descrição</label>
                        <textarea
                          className="mt-1 block w-full rounded-md border p-2"
                          value={newService.description}
                          onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium">Categoria</label>
                          <select
                            className="mt-1 block w-full rounded-md border p-2"
                            value={newService.category}
                            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                          >
                            <option value="">Selecione</option>
                            <option value="Cabelo">Cabelo</option>
                            <option value="Barba">Barba</option>
                            <option value="Unhas">Unhas</option>
                            <option value="Maquiagem">Maquiagem</option>
                            <option value="Depilação">Depilação</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duração (min) *</label>
                          <input
                            type="number"
                            className="mt-1 block w-full rounded-md border p-2"
                            value={newService.duration}
                            onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                            required
                            min="15"
                            step="15"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Preço (R$) *</label>
                          <input
                            type="number"
                            className="mt-1 block w-full rounded-md border p-2"
                            value={newService.price}
                            onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                            required
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddingService(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddService}>
                          Salvar Serviço
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {providerServices.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {providerServices.map((service) => (
                          <div
                            key={service.id}
                            className="rounded-lg border p-4"
                          >
                            <div className="flex justify-between">
                              <div className="font-medium">{service.name}</div>
                              <div className="font-medium">R$ {service.price.toFixed(2)}</div>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {service.description}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{service.duration} minutos</span>
                              </div>
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {service.category}
                              </span>
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                              <Button size="sm" variant="outline">
                                Editar
                              </Button>
                              <Button size="sm" variant="destructive">
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <h3 className="font-medium">Nenhum serviço cadastrado</h3>
                        <p className="mt-1 text-gray-500">
                          Adicione seus serviços para que os clientes possam agendar.
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => setIsAddingService(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Serviço
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <div className="aspect-square overflow-hidden rounded-lg">
                      {currentUser.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-4xl text-primary">
                          {currentUser.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <Button className="mt-4 w-full">Alterar Foto</Button>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Especialidades</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentUser.specialties?.map((specialty, index) => (
                          <div
                            key={index}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary"
                          >
                            {specialty}
                          </div>
                        ))}
                      </div>
                      <Button size="sm" className="mt-4 w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Especialidade
                      </Button>
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome Profissional</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border p-2"
                        value={currentUser.name}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        className="mt-1 block w-full rounded-md border p-2"
                        value={currentUser.email}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone</label>
                      <input
                        type="tel"
                        className="mt-1 block w-full rounded-md border p-2"
                        value={currentUser.phoneNumber || ""}
                        placeholder="Adicionar telefone"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Biografia Profissional</label>
                      <textarea
                        className="mt-1 block w-full rounded-md border p-2"
                        rows={4}
                        placeholder="Conte um pouco sobre sua experiência e habilidades..."
                      />
                    </div>
                    <div className="pt-4">
                      <Button>Salvar Alterações</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProviderDashboardPage;
