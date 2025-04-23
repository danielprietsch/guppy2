
export interface User {
  id: string;
  name: string;
  email: string;
  userType: "client" | "provider" | "owner";
  phoneNumber?: string;
  avatarUrl?: string;
  specialties?: string[];
  ownedLocationIds?: string[]; // For owners to track which locations they own
}

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cabinsCount: number;
  openingHours: {
    open: string;
    close: string;
  };
  amenities: string[];
  imageUrl: string;
  description?: string; // Adding the missing property
}

export interface Cabin {
  id: string;
  locationId: string;
  name: string;
  description: string;
  equipment: string[];
  imageUrl: string;
  availability: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  price?: number;
  pricing?: {
    defaultPricing: {
      [dayOfWeek: string]: {
        morning: number;
        afternoon: number;
        evening: number;
      };
    };
    specificDates: {
      [date: string]: {
        morning: number;
        afternoon: number;
        evening: number;
        availability?: {
          morning: boolean;
          afternoon: boolean;
          evening: boolean;
        };
      };
    };
  };
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

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
}

export interface Review {
  id: string;
  providerId: string;
  clientId: string;
  rating: number;
  comment: string;
  date: string;
}
