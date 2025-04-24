
export interface User {
  id: string;
  name: string;
  email: string;
  userType: "client" | "provider" | "owner" | "global_admin";
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  roles?: string[];
  specialties?: string[];
  ownedLocationIds?: string[];
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cabinsCount: number;
  openingHours: { open: string; close: string };
  amenities: string[];
  imageUrl?: string;
  description?: string;
  ownerId?: string;
  active?: boolean;
}

export interface Cabin {
  id: string;
  locationId: string;
  name: string;
  description: string;
  equipment: string[];
  imageUrl?: string;
  availability: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  price?: number;
  pricing?: {
    defaultPricing: any;
    specificDates: any;
  };
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
}

export interface Booking {
  id: string;
  cabinId: string;
  providerId: string;
  date: string;
  shift: "morning" | "afternoon" | "evening";
  status: "pending" | "confirmed" | "cancelled";
  price: number;
}

export interface Appointment {
  id: string;
  providerId: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  price: number;
}

export interface Review {
  id: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment?: string;
  date: string;
}

export interface SystemEquipment {
  id: string;
  name: string;
  description?: string;
}

// Predefined equipment options for cabins
export const PREDEFINED_EQUIPMENT: SystemEquipment[] = [
  {
    id: "1",
    name: "Espelho completo",
    description: "Espelho de corpo inteiro"
  },
  {
    id: "2",
    name: "Cadeira hidráulica",
    description: "Cadeira ajustável com sistema hidráulico"
  },
  {
    id: "3",
    name: "Secador profissional",
    description: "Secador de alta potência"
  },
  {
    id: "4",
    name: "Pia para lavagem",
    description: "Pia exclusiva para lavagem de cabelo"
  },
  {
    id: "5",
    name: "Iluminação especial",
    description: "Sistema de iluminação profissional"
  },
  {
    id: "6",
    name: "Climatização",
    description: "Sistema de ar condicionado"
  },
  {
    id: "7",
    name: "TV",
    description: "Televisão para entretenimento"
  },
  {
    id: "8",
    name: "Bancada iluminada",
    description: "Bancada com iluminação para maquiagem"
  },
  {
    id: "9",
    name: "Kit secadores",
    description: "Conjunto de secadores profissionais"
  },
  {
    id: "10",
    name: "Cadeira elétrica",
    description: "Cadeira com ajustes elétricos"
  },
  {
    id: "11",
    name: "Cadeira reclinável",
    description: "Cadeira com sistema de reclinação"
  },
  {
    id: "12",
    name: "Lavatório",
    description: "Lavatório para procedimentos"
  }
];
