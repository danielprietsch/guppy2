import { Location, Cabin, Service, Booking, Appointment, Review } from "./types";

// Mantendo apenas os dados mock que ainda são necessários em outras partes do sistema
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
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    description: "Espaço moderno e confortável para profissionais da beleza"
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
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    description: "Local aconchegante com fácil acesso"
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
    imageUrl: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=800&q=80",
    description: "Ambiente privativo localizado em centro comercial"
  }
];

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
    },
    price: 100
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
    },
    price: 120
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
    },
    price: 150
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
    },
    price: 90
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
    },
    price: 80
  }
];

export const services: Service[] = [
  {
    id: "1",
    professionalId: "1",
    name: "Corte Feminino",
    description: "Corte feminino personalizado com análise de face e estilo",
    duration: 60,
    price: 120,
    category: "Cabelo"
  },
  {
    id: "2",
    professionalId: "1",
    name: "Coloração",
    description: "Coloração completa com produtos de qualidade",
    duration: 120,
    price: 200,
    category: "Cabelo"
  },
  {
    id: "3",
    professionalId: "2",
    name: "Corte Masculino",
    description: "Corte masculino com acabamento de navalha",
    duration: 45,
    price: 80,
    category: "Cabelo"
  },
  {
    id: "4",
    professionalId: "2",
    name: "Barba Completa",
    description: "Barba com toalha quente e produtos especializados",
    duration: 30,
    price: 60,
    category: "Barba"
  },
  {
    id: "5",
    professionalId: "3",
    name: "Manicure",
    description: "Tratamento completo para unhas das mãos",
    duration: 45,
    price: 50,
    category: "Unhas"
  }
];

export const bookings: Booking[] = [
  {
    id: "1",
    cabinId: "1",
    professionalId: "1",
    date: "2025-04-25",
    shift: "morning",
    status: "confirmed",
    price: 100
  },
  {
    id: "2",
    cabinId: "2",
    professionalId: "2",
    date: "2025-04-26",
    shift: "afternoon",
    status: "confirmed",
    price: 150
  },
  {
    id: "3",
    cabinId: "3",
    professionalId: "3",
    date: "2025-04-27",
    shift: "evening",
    status: "pending",
    price: 150
  }
];

export const appointments: Appointment[] = [
  {
    id: "1",
    professionalId: "1",
    clientId: "4",
    serviceId: "1",
    date: "2025-04-25",
    time: "10:00",
    status: "confirmed",
    price: 120
  },
  {
    id: "2",
    professionalId: "2",
    clientId: "5",
    serviceId: "3",
    date: "2025-04-26",
    time: "14:00",
    status: "confirmed",
    price: 80
  },
  {
    id: "3",
    professionalId: "3",
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
    professionalId: "1",
    clientId: "4",
    rating: 5,
    comment: "Excelente profissional, resultado perfeito!",
    date: "2025-03-15"
  },
  {
    id: "2",
    professionalId: "2",
    clientId: "5",
    rating: 4,
    comment: "Muito bom, apenas um pouco de atraso no atendimento.",
    date: "2025-03-20"
  },
  {
    id: "3",
    professionalId: "3",
    clientId: "4",
    rating: 5,
    comment: "Serviço impecável, voltarei sempre!",
    date: "2025-03-25"
  }
];
