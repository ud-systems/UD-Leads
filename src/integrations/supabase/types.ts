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
          weekly_spend: string | null
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
          top_3_selling_products: string[] | null
          last_visit: string | null
          next_visit: string | null
          exterior_photo_url: string | null
          interior_photo_url: string | null
          exterior_photos: string[] | null
          interior_photos: string[] | null
          current_supplier: string | null
          owns_shop_or_website: string | null
          number_of_stores: string | null
          manager_id: string | null
          postal_code: string | null
          form_start_time: string | null
          form_submit_time: string | null
          form_duration_ms: number | null
          followup_status: string | null
          followup_completed_date: string | null
          followup_completed_time: string | null
          followup_notes: string | null
          status_color_id: number | null
          first_visit_date: string | null
          last_visit_date: string | null
          total_visit_count: number | null
          lead_age_days: number | null
          conversion_date: string | null
          lead_status_updated_at: string | null
        }
        Insert: {
          id?: string
          store_name?: string | null
          phone_number?: string | null
          email?: string | null
          status?: string | null
          store_type?: string | null
          weekly_spend?: string | null
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
          top_3_selling_products?: string[] | null
          last_visit?: string | null
          next_visit?: string | null
          exterior_photo_url?: string | null
          interior_photo_url?: string | null
          exterior_photos?: string[] | null
          interior_photos?: string[] | null
          current_supplier?: string | null
          owns_shop_or_website?: string | null
          number_of_stores?: string | null
          manager_id?: string | null
          postal_code?: string | null
        }
        Update: {
          id?: string
          store_name?: string | null
          phone_number?: string | null
          email?: string | null
          status?: string | null
          store_type?: string | null
          weekly_spend?: string | null
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
          top_3_selling_products?: string[] | null
          last_visit?: string | null
          next_visit?: string | null
          exterior_photo_url?: string | null
          interior_photo_url?: string | null
          exterior_photos?: string[] | null
          interior_photos?: string[] | null
          current_supplier?: string | null
          owns_shop_or_website?: string | null
          number_of_stores?: string | null
          manager_id?: string | null
          postal_code?: string | null
          form_start_time?: string | null
          form_submit_time?: string | null
          form_duration_ms?: number | null
          followup_status?: string | null
          followup_completed_date?: string | null
          followup_completed_time?: string | null
          followup_notes?: string | null
          status_color_id?: number | null
          first_visit_date?: string | null
          last_visit_date?: string | null
          total_visit_count?: number | null
          lead_age_days?: number | null
          conversion_date?: string | null
          lead_status_updated_at?: string | null
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
          exterior_photos: string[] | null
          interior_photos: string[] | null
          visit_start_time: string | null
          visit_end_time: string | null
          visit_duration_minutes: number | null
          visit_number: number | null
          photo_count: number | null
          visit_latitude: number | null
          visit_longitude: number | null
          location_validated: boolean | null
          location_accuracy_meters: number | null
          visit_type: string | null
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
          exterior_photos?: string[] | null
          interior_photos?: string[] | null
          visit_start_time?: string | null
          visit_end_time?: string | null
          visit_duration_minutes?: number | null
          visit_number?: number | null
          photo_count?: number | null
          visit_latitude?: number | null
          visit_longitude?: number | null
          location_validated?: boolean | null
          location_accuracy_meters?: number | null
          visit_type?: string | null
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
          exterior_photos?: string[] | null
          interior_photos?: string[] | null
          visit_start_time?: string | null
          visit_end_time?: string | null
          visit_duration_minutes?: number | null
          visit_number?: number | null
          photo_count?: number | null
          visit_latitude?: number | null
          visit_longitude?: number | null
          location_validated?: boolean | null
          location_accuracy_meters?: number | null
          visit_type?: string | null
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
      users: {
        Row: {
          id: string
          email: string | null
          name: string | null
          role: string | null
          created_at: string | null
          updated_at: string | null
          manager_id: string | null
        }
        Insert: {
          id?: string
          email?: string | null
          name?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
          manager_id?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
          manager_id?: string | null
        }
      }
      followups: {
        Row: {
          id: string
          lead_id: string
          salesperson_id: string | null
          status: string
          scheduled_date: string
          scheduled_time: string | null
          notes: string | null
          completed_date: string | null
          completed_time: string | null
          created_at: string | null
          updated_at: string | null
          manager_id: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          salesperson_id?: string | null
          status?: string
          scheduled_date: string
          scheduled_time?: string | null
          notes?: string | null
          completed_date?: string | null
          completed_time?: string | null
          created_at?: string | null
          updated_at?: string | null
          manager_id?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          salesperson_id?: string | null
          status?: string
          scheduled_date?: string
          scheduled_time?: string | null
          notes?: string | null
          completed_date?: string | null
          completed_time?: string | null
          created_at?: string | null
          updated_at?: string | null
          manager_id?: string | null
        }
      }
      status_colors: {
        Row: {
          id: number
          status_name: string
          color_code: string
          background_color: string
          text_color: string
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          status_name: string
          color_code: string
          background_color: string
          text_color: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          status_name?: string
          color_code?: string
          background_color?: string
          text_color?: string
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
      lead_notes: {
        Row: {
          id: string
          lead_id: string
          note_text: string
          note_type: string | null
          created_by: string | null
          created_by_name: string | null
          created_at: string | null
          updated_at: string | null
          visit_id: string | null
          salesperson_name: string | null
          followup_id: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          note_text: string
          note_type?: string | null
          created_by?: string | null
          created_by_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          visit_id?: string | null
          salesperson_name?: string | null
          followup_id?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          note_text?: string
          note_type?: string | null
          created_by?: string | null
          created_by_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          visit_id?: string | null
          salesperson_name?: string | null
          followup_id?: string | null
        }
      }
      system_settings: {
        Row: {
          id: string
          key: string | null
          value: string | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key?: string | null
          value?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string | null
          value?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      lead_status_history: {
        Row: {
          id: number
          lead_id: string
          old_status: string | null
          new_status: string
          changed_at: string | null
          changed_by: string | null
          conversion_counted: boolean
        }
        Insert: {
          id?: number
          lead_id: string
          old_status?: string | null
          new_status: string
          changed_at?: string | null
          changed_by?: string | null
          conversion_counted?: boolean
        }
        Update: {
          id?: number
          lead_id?: string
          old_status?: string | null
          new_status?: string
          changed_at?: string | null
          changed_by?: string | null
          conversion_counted?: boolean
        }
      }
      conversion_rules: {
        Row: {
          id: number
          rule_name: string
          rule_type: string
          from_status: string | null
          to_status: string
          is_active: boolean
          is_default: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          rule_name: string
          rule_type: string
          from_status?: string | null
          to_status: string
          is_active?: boolean
          is_default?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          rule_name?: string
          rule_type?: string
          from_status?: string | null
          to_status?: string
          is_active?: boolean
          is_default?: boolean
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
