import { User, Location, Cabin, Service, Booking, Appointment, Review } from "./types";

// Usuários mantêm informações gerais, só alterando cidade se for apresentada explicitamente — usuários são genéricos.

export const users: User[] = [
  {
    id: "1",
    name: "Ana Silva",
    email: "ana.silva@example.com",
    userType: "provider",
    phoneNumber: "(71) 98765-4321",
    avatarUrl: "https://randomuser.me/api/portraits/women/1.jpg",
    specialties: ["Cabelereiro", "Colorista"]
  },
  {
    id: "2",
    name: "Carlos Oliveira",
    email: "carlos.oliveira@example.com",
    userType: "provider",
    phoneNumber: "(71) 91234-5678",
    avatarUrl: "https://randomuser.me/api/portraits/men/2.jpg",
    specialties: ["Barbeiro", "Barba Designer"]
  },
  {
    id: "3",
    name: "Mariana Santos",
    email: "mariana.santos@example.com",
    userType: "provider",
    phoneNumber: "(71) 99876-5432",
    avatarUrl: "https://randomuser.me/api/portraits/women/3.jpg",
    specialties: ["Manicure", "Pedicure"]
  },
  {
    id: "4",
    name: "João Costa",
    email: "joao.costa@example.com",
    userType: "client",
    phoneNumber: "(71) 98888-7777",
    avatarUrl: "https://randomuser.me/api/portraits/men/4.jpg"
  },
  {
    id: "5",
    name: "Fernanda Lima",
    email: "fernanda.lima@example.com",
    userType: "client",
    phoneNumber: "(71) 97777-6666",
    avatarUrl: "https://randomuser.me/api/portraits/women/5.jpg"
  },
  {
    id: "6",
    name: "Roberto Almeida",
    email: "roberto.almeida@example.com",
    userType: "owner",
    phoneNumber: "(71) 96666-5555",
    avatarUrl: "https://randomuser.me/api/portraits/men/6.jpg",
    ownedLocationIds: ["1", "2"]
  },
  {
    id: "7",
    name: "Patricia Gomes",
    email: "patricia.gomes@example.com",
    userType: "owner",
    phoneNumber: "(71) 95555-4444",
    avatarUrl: "https://randomuser.me/api/portraits/women/7.jpg",
    ownedLocationIds: ["3", "4"]
  }
];

// LOCAIS TODOS EM SALVADOR/IMBUÍ + novo local "CCI Loja 12"
export const locations: Location[] = [
  {
    id: "1",
    name: "Beauty Space Imbuí",
    address: "Rua das Nações Unidas, 250",
    city: "Salvador",
    state: "BA",
    zipCode: "41720-260",
    cabinsCount: 6,
    openingHours: { open: "08:00", close: "22:00" },
    amenities: ["Wifi", "Estacionamento", "Ar-condicionado"],
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "2",
    name: "Espaço Beleza Imbuí",
    address: "Avenida Jorge Amado, 180",
    city: "Salvador",
    state: "BA",
    zipCode: "41720-320",
    cabinsCount: 4,
    openingHours: { open: "09:00", close: "20:00" },
    amenities: ["Café", "Recepção", "Ar-condicionado"],
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "3",
    name: "CCI Loja 12",
    address: "Rua das Patativas, 100 - Loja 12",
    city: "Salvador",
    state: "BA",
    zipCode: "41720-120",
    cabinsCount: 2,
    openingHours: { open: "10:00", close: "21:00" },
    amenities: ["Acessibilidade", "Banheiro privativo", "Ar-condicionado"],
    imageUrl: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80"
  }
];

// CABINES – associadas ao local correto, sempre com endereço em Imbuí/Salvador
export const cabins: Cabin[] = [
  {
    id: "1",
    locationId: "1",
    name: "Cabine A1",
    description: "Cabine espaçosa com iluminação natural, localizada no coração do Imbuí",
    equipment: ["Espelho completo", "Cadeira hidráulica", "Secador profissional", "Pia para lavagem"],
    imageUrl: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80",
    availability: {
      morning: true,
      afternoon: false,
      evening: true
    }
  },
  {
    id: "2",
    locationId: "1",
    name: "Cabine A2",
    description: "Cabine moderna com equipamentos de última geração, ambiente climatizado no Imbuí",
    equipment: ["Espelho completo", "Cadeira elétrica", "Secador profissional", "Pia para lavagem", "Climatização"],
    imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80",
    availability: {
      morning: true,
      afternoon: true,
      evening: false
    }
  },
  {
    id: "3",
    locationId: "2",
    name: "Cabine B1",
    description: "Cabine premium com isolamento acústico, perfeita para relaxamento no bairro Imbuí",
    equipment: ["Espelho completo", "Cadeira elétrica", "Kit secadores profissionais", "Pia para lavagem", "Climatização", "TV"],
    imageUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=80",
    availability: {
      morning: false,
      afternoon: true,
      evening: true
    }
  },
  {
    id: "4",
    locationId: "4",
    name: "Cabine CCI 1",
    description: "Ambiente reservado, ideal para tratamentos detalhados no Imbuí",
    equipment: ["Espelho grande", "Cadeira reclinável", "Lavatório"],
    imageUrl: "https://images.unsplash.com/photo-1470259078422-826894b933aa?auto=format&fit=crop&w=800&q=80",
    availability: {
      morning: true,
      afternoon: true,
      evening: true
    }
  },
  {
    id: "5",
    locationId: "4",
    name: "Cabine CCI 2",
    description: "Cabine com ótima ventilação e privacidade dentro do Imbuí",
    equipment: ["Cadeira hidráulica", "Bancada iluminada"],
    imageUrl: "https://images.unsplash.com/photo-1633687367233-b9097e506d60?auto=format&fit=crop&w=800&q=80",
    availability: {
      morning: false,
      afternoon: true,
      evening: false
    }
  }
];

export const services: Service[] = [
  {
    id: "1",
    providerId: "1",
    name: "Corte Feminino",
    description: "Corte feminino personalizado com análise de face e estilo",
    duration: 60,
    price: 120,
    category: "Cabelo"
  },
  {
    id: "2",
    providerId: "1",
    name: "Coloração",
    description: "Coloração completa com produtos de qualidade",
    duration: 120,
    price: 200,
    category: "Cabelo"
  },
  {
    id: "3",
    providerId: "2",
    name: "Corte Masculino",
    description: "Corte masculino com acabamento de navalha",
    duration: 45,
    price: 80,
    category: "Cabelo"
  },
  {
    id: "4",
    providerId: "2",
    name: "Barba Completa",
    description: "Barba com toalha quente e produtos especializados",
    duration: 30,
    price: 60,
    category: "Barba"
  },
  {
    id: "5",
    providerId: "3",
    name: "Manicure",
    description: "Tratamento completo para unhas das mãos",
    duration: 45,
    price: 50,
    category: "Unhas"
  }
];

// BOOKINGS mantêm associações funcionais
export const bookings: Booking[] = [
  {
    id: "1",
    cabinId: "1",
    providerId: "1",
    date: "2025-04-25",
    shift: "morning",
    status: "confirmed",
    price: 100
  },
  {
    id: "2",
    cabinId: "2",
    providerId: "2",
    date: "2025-04-26",
    shift: "afternoon",
    status: "confirmed",
    price: 150
  },
  {
    id: "3",
    cabinId: "3",
    providerId: "3",
    date: "2025-04-27",
    shift: "evening",
    status: "pending",
    price: 150
  }
];

export const appointments: Appointment[] = [
  {
    id: "1",
    providerId: "1",
    clientId: "4",
    serviceId: "1",
    date: "2025-04-25",
    time: "10:00",
    status: "confirmed",
    price: 120
  },
  {
    id: "2",
    providerId: "2",
    clientId: "5",
    serviceId: "3",
    date: "2025-04-26",
    time: "14:00",
    status: "confirmed",
    price: 80
  },
  {
    id: "3",
    providerId: "3",
    clientId: "4",
    serviceId: "5",
    date: "2025-04-27",
    time: "16:00",
    status: "pending",
    price: 50
  }
];

export const reviews: Review[] = [
  {
    id: "1",
    providerId: "1",
    clientId: "4",
    rating: 5,
    comment: "Excelente profissional, resultado perfeito!",
    date: "2025-03-15"
  },
  {
    id: "2",
    providerId: "2",
    clientId: "5",
    rating: 4,
    comment: "Muito bom, apenas um pouco de atraso no atendimento.",
    date: "2025-03-20"
  },
  {
    id: "3",
    providerId: "3",
    clientId: "4",
    rating: 5,
    comment: "Serviço impecável, voltarei sempre!",
    date: "2025-03-25"
  }
];
