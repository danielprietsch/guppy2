export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_approvals: {
        Row: {
          approved_by: string | null
          created_at: string | null
          id: string
          location_id: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          location_id: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_approvals_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
          id: string
          price: number
          professional_id: string | null
          service_id: string | null
          status: string | null
          time: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          price: number
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
          time: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          price?: number
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
          time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          cabin_id: string | null
          created_at: string | null
          date: string
          id: string
          price: number
          professional_id: string | null
          shift: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          cabin_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          price: number
          professional_id?: string | null
          shift: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          cabin_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          price?: number
          professional_id?: string | null
          shift?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          availability: Json | null
          created_at: string | null
          description: string | null
          equipment: string[] | null
          id: string
          image_url: string | null
          location_id: string | null
          name: string
          pricing: Json | null
          updated_at: string | null
        }
        Insert: {
          availability?: Json | null
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name: string
          pricing?: Json | null
          updated_at?: string | null
        }
        Update: {
          availability?: Json | null
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          name?: string
          pricing?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cabins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean | null
          address: string
          amenities: string[] | null
          approval_status: string
          cabins_count: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          state: string
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          active?: boolean | null
          address: string
          amenities?: string[] | null
          approval_status?: string
          cabins_count?: number | null
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          state: string
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          active?: boolean | null
          address?: string
          amenities?: string[] | null
          approval_status?: string
          cabins_count?: number | null
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          state?: string
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      professional_availability: {
        Row: {
          afternoon_status: string
          break_time: Json | null
          created_at: string | null
          date: string
          evening_status: string
          id: string
          morning_status: string
          professional_id: string
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          afternoon_status?: string
          break_time?: Json | null
          created_at?: string | null
          date: string
          evening_status?: string
          id?: string
          morning_status?: string
          professional_id: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          afternoon_status?: string
          break_time?: Json | null
          created_at?: string | null
          date?: string
          evening_status?: string
          id?: string
          morning_status?: string
          professional_id?: string
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_calendar_events: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          professional_id: string
          start_time: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          professional_id: string
          start_time: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          professional_id?: string
          start_time?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          commission_rate: number | null
          cpf: string | null
          created_at: string | null
          email: string | null
          has_own_location: boolean | null
          id: string
          is_public: boolean | null
          name: string | null
          phone_number: string | null
          state: string | null
          updated_at: string | null
          user_type: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          has_own_location?: boolean | null
          id: string
          is_public?: boolean | null
          name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          user_type?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          commission_rate?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          has_own_location?: boolean | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          user_type?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string | null
          comment: string | null
          created_at: string | null
          date: string | null
          id: string
          professional_id: string | null
          rating: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          professional_id?: string | null
          rating: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          professional_id?: string | null
          rating?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration: number
          id: string
          location_type: string | null
          name: string
          price: number
          professional_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          location_type?: string | null
          name: string
          price: number
          professional_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          location_type?: string | null
          name?: string
          price?: number
          professional_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_equipment: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_request_approval: {
        Args: { user_id: string; location_id: string }
        Returns: boolean
      }
      check_location_ownership: {
        Args: { loc_id: string; user_id: string }
        Returns: boolean
      }
      check_owner_status: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_professional_availability: {
        Args: { p_professional_id: string; p_date: string; p_shift: string }
        Returns: boolean
      }
      check_user_owns_location: {
        Args: { location_id: string; user_id: string }
        Returns: boolean
      }
      create_booking: {
        Args: {
          cabin_id: string
          professional_id: string
          date: string
          shift: string
          price: number
          status?: string
        }
        Returns: string
      }
      create_location: {
        Args: {
          p_owner_id: string
          p_name: string
          p_address: string
          p_city: string
          p_state: string
          p_zip_code: string
          p_opening_hours?: Json
          p_image_url?: string
          p_description?: string
          p_amenities?: string[]
        }
        Returns: string
      }
      fetch_all_bookings_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          professional_id: string
          cabin_id: string
          date: string
          shift: string
          price: number
          status: string
          created_at: string
          professional_name: string
          cabin_name: string
        }[]
      }
      fetch_all_locations: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean | null
          address: string
          amenities: string[] | null
          approval_status: string
          cabins_count: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          state: string
          updated_at: string | null
          zip_code: string
        }[]
      }
      fetch_professional_calendar_events: {
        Args: {
          p_professional_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Json[]
      }
      fetch_user_locations: {
        Args: { p_owner_id: string }
        Returns: {
          active: boolean | null
          address: string
          amenities: string[] | null
          approval_status: string
          cabins_count: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          state: string
          updated_at: string | null
          zip_code: string
        }[]
      }
      get_all_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          user_type: string
        }[]
      }
      get_allowed_user_types: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_profile_user_type: {
        Args: { user_id: string }
        Returns: string
      }
      get_profile_visibility: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_public_professionals: {
        Args: Record<PropertyKey, never>
        Returns: {
          address: string | null
          avatar_url: string | null
          city: string | null
          commission_rate: number | null
          cpf: string | null
          created_at: string | null
          email: string | null
          has_own_location: boolean | null
          id: string
          is_public: boolean | null
          name: string | null
          phone_number: string | null
          state: string | null
          updated_at: string | null
          user_type: string | null
          zip_code: string | null
        }[]
      }
      get_user_locations: {
        Args: { user_id: string }
        Returns: {
          active: boolean | null
          address: string
          amenities: string[] | null
          approval_status: string
          cabins_count: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          state: string
          updated_at: string | null
          zip_code: string
        }[]
      }
      is_global_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_same_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_global_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_user_owner: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_within_working_hours: {
        Args: {
          professional_id: string
          check_date: string
          check_time: string
        }
        Returns: boolean
      }
      update_admin_profile: {
        Args: {
          user_id: string
          user_name: string
          user_email: string
          user_phone: string
          user_avatar: string
        }
        Returns: boolean
      }
      update_avatar_everywhere: {
        Args: { user_id: string; avatar_url: string }
        Returns: boolean
      }
      update_location_approval_status: {
        Args: { location_id: string; new_status: string; admin_id: string }
        Returns: boolean
      }
      update_profile_visibility: {
        Args: { user_id: string; is_public: boolean }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
