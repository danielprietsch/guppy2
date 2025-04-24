export interface User {
  id: string;
  name: string;
  email: string;
  userType: "client" | "provider" | "owner";
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  roles?: string[];
}
