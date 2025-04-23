
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Appointment } from "@/lib/types";
import { appointments, users } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Calendar, Clock, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ClientDashboardPage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  
  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("currentUser");
    
    if (storedUser) {
      const user = JSON.parse(storedUser) as User;
      
      // Check if user is a client
      if (user.userType !== "client") {
        toast({
          title: "Acesso negado",
          description: "Esta página é apenas para clientes.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      
      setCurrentUser(user);
      
      // Filter appointments for this client
      const userAppointments = appointments.filter(
        (appointment) => appointment.clientId === user.id
      );
      setClientAppointments(userAppointments);
    } else {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [navigate]);

  // Helper function to get provider name from ID
  const getProviderName = (providerId: string) => {
    const provider = users.find((user) => user.id === providerId);
    return provider ? provider.name : "Desconhecido";
  };
  
  // Helper function to format date
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

  if (!currentUser) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container px-4 py-12 md:px-6 md:py-16">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {currentUser.name}</h1>
          <p className="mt-1 text-gray-500">Bem-vindo ao seu painel de controle</p>
        </div>
        <Button
          variant="outline"
          className="mt-4 md:mt-0"
          onClick={handleLogout}
        >
          Sair
        </Button>
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="appointments">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="appointments">Meus Agendamentos</TabsTrigger>
            <TabsTrigger value="search">Buscar Profissionais</TabsTrigger>
            <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="appointments">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meus Agendamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientAppointments.length > 0 ? (
                    <div className="space-y-4">
                      {clientAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="rounded-lg border p-4 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium">
                              {getProviderName(appointment.providerId)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(appointment.date)}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.time}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              R$ {appointment.price.toFixed(2)}
                            </div>
                            <div
                              className={`mt-1 text-xs ${
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <h3 className="font-medium">Nenhum agendamento encontrado</h3>
                      <p className="mt-1 text-gray-500">
                        Você ainda não possui nenhum agendamento.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => navigate("/providers")}
                      >
                        Buscar Profissionais
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Encontrar Profissionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar por nome, especialidade ou local"
                      className="flex-1 border-0 bg-transparent p-0 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {users
                    .filter((user) => user.userType === "provider")
                    .slice(0, 6)
                    .map((provider) => (
                      <div
                        key={provider.id}
                        className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/providers/${provider.id}`)}
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={provider.avatarUrl}
                            alt={provider.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <div className="font-medium">{provider.name}</div>
                          <div className="mt-1 text-sm text-gray-500">
                            {provider.specialties?.join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="text-center mt-6">
                  <Button onClick={() => navigate("/providers")}>
                    Ver Todos os Profissionais
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
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
                  </div>
                  <div className="md:w-2/3 space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome Completo</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border p-2"
                        value={currentUser.name}
                        readOnly
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
                      <label className="text-sm font-medium">Tipo de Usuário</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border p-2"
                        value={currentUser.userType === "client" ? "Cliente" : "Prestador de Serviço"}
                        readOnly
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

export default ClientDashboardPage;
