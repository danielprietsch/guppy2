export interface User {
  id: string;
  name: string;
  email: string;
  user_type: "professional" | "client" | "owner" | "global_admin";
  avatarUrl?: string;
  phoneNumber?: string;
  specialties?: string[];
  bio?: string;
  companyName?: string;
  cnpj?: string;
  ownedLocationIds?: string[]; 
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  avatar_url?: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
  hasOwnLocation?: boolean;
  commission_rate?: number;
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
  created_at?: string;
}

export interface Service {
  id: string;
  providerId?: string;
  professionalId?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  locationType?: 'cabin' | 'professional_location' | 'both';
}

export interface Booking {
  id: string;
  cabinId: string;
  providerId?: string;
  professionalId?: string;
  date: string;
  shift: "morning" | "afternoon" | "evening";
  status: "pending" | "confirmed" | "cancelled";
  price: number;
}

export interface Appointment {
  id: string;
  providerId?: string;
  professionalId?: string;
  clientId: string;
  serviceId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  price: number;
}

export interface Review {
  id: string;
  providerId?: string;
  professionalId?: string;
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

export interface OwnerProfileHook {
  currentUser: User | null;
  isLoading: boolean;
  error?: string;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateProfile?: (data: Partial<User>) => Promise<void>;
}
