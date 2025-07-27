export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          store_name: string | null
          phone_number: string | null
          email: string | null
          status: string | null
          store_type: string | null
          buying_power: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          photo_url: string | null
          territory_id: string | null
          salesperson: string | null
          company_name: string | null
          contact_person: string | null
          latitude: number | null
          longitude: number | null
          products_currently_sold: string[] | null
          last_visit: string | null
          next_visit: string | null
          exterior_photo_url: string | null
          interior_photo_url: string | null
          manager_id: string | null
        }
        Insert: {
          id?: string
          store_name?: string | null
          phone_number?: string | null
          email?: string | null
          status?: string | null
          store_type?: string | null
          buying_power?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          photo_url?: string | null
          territory_id?: string | null
          salesperson?: string | null
          company_name?: string | null
          contact_person?: string | null
          latitude?: number | null
          longitude?: number | null
          products_currently_sold?: string[] | null
          last_visit?: string | null
          next_visit?: string | null
          exterior_photo_url?: string | null
          interior_photo_url?: string | null
          manager_id?: string | null
        }
        Update: {
          id?: string
          store_name?: string | null
          phone_number?: string | null
          email?: string | null
          status?: string | null
          store_type?: string | null
          buying_power?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          photo_url?: string | null
          territory_id?: string | null
          salesperson?: string | null
          company_name?: string | null
          contact_person?: string | null
          latitude?: number | null
          longitude?: number | null
          products_currently_sold?: string[] | null
          last_visit?: string | null
          next_visit?: string | null
          exterior_photo_url?: string | null
          interior_photo_url?: string | null
          manager_id?: string | null
        }
      }
      visits: {
        Row: {
          id: string
          lead_id: string | null
          date: string | null
          time: string | null
          status: string | null
          salesperson: string | null
          notes: string | null
          created_at: string | null
          manager_id: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          date?: string | null
          time?: string | null
          status?: string | null
          salesperson?: string | null
          notes?: string | null
          created_at?: string | null
          manager_id?: string | null
        }
        Update: {
          id?: string
          lead_id?: string | null
          date?: string | null
          time?: string | null
          status?: string | null
          salesperson?: string | null
          notes?: string | null
          created_at?: string | null
          manager_id?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string | null
          contact_person: string | null
          email: string | null
          phone: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string | null
        }
      }
      territories: {
        Row: {
          id: string
          city: string | null
          country: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          city?: string | null
          country?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          city?: string | null
          country?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: string | null
          avatar_url: string | null
          manager_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          email?: string | null
          role?: string | null
          avatar_url?: string | null
          manager_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          role?: string | null
          avatar_url?: string | null
          manager_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string | null
          value: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          key?: string | null
          value?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          key?: string | null
          value?: Json | null
          created_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          primary_color: string | null
          accent_color: string | null
          secondary_color: string | null
          active_color: string | null
          inactive_color: string | null
          daily_visit_target: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          primary_color?: string | null
          accent_color?: string | null
          secondary_color?: string | null
          active_color?: string | null
          inactive_color?: string | null
          daily_visit_target?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          primary_color?: string | null
          accent_color?: string | null
          secondary_color?: string | null
          active_color?: string | null
          inactive_color?: string | null
          daily_visit_target?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      targets: {
        Row: {
          id: string
          user_id: string
          target_type: string
          metric_type: string
          target_value: number
          achieved_value: number
          period_start: string
          period_end: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          target_type: string
          metric_type?: string
          target_value: number
          achieved_value?: number
          period_start: string
          period_end: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          target_type?: string
          metric_type?: string
          target_value?: number
          achieved_value?: number
          period_start?: string
          period_end?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          name: string | null
          type: string
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          type?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          type?: string
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: string
          joined_at: string | null
          last_read_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role?: string
          joined_at?: string | null
          last_read_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: string
          joined_at?: string | null
          last_read_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string | null
          content: string
          message_type: string
          metadata: Json | null
          is_edited: boolean | null
          edited_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id?: string | null
          content: string
          message_type?: string
          metadata?: Json | null
          is_edited?: boolean | null
          edited_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string | null
          content?: string
          message_type?: string
          metadata?: Json | null
          is_edited?: boolean | null
          edited_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
