export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agreement_signatures: {
        Row: {
          agreement_id: string
          created_at: string
          id: string
          signed: boolean | null
          signed_at: string | null
          unit_id: string
        }
        Insert: {
          agreement_id: string
          created_at?: string
          id?: string
          signed?: boolean | null
          signed_at?: string | null
          unit_id: string
        }
        Update: {
          agreement_id?: string
          created_at?: string
          id?: string
          signed?: boolean | null
          signed_at?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreement_signatures_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreement_signatures_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          created_at: string
          id: string
          name: string
          signed_count: number | null
          site_id: string
          total_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          signed_count?: number | null
          site_id: string
          total_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          signed_count?: number | null
          site_id?: string
          total_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string
          id: string
          is_pinned: boolean | null
          published_at: string
          site_id: string
          title: string
          updated_at: string
          views: number | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          published_at?: string
          site_id: string
          title: string
          updated_at?: string
          views?: number | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          published_at?: string
          site_id?: string
          title?: string
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_chats: {
        Row: {
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_chats_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      cs_messages: {
        Row: {
          chat_id: string
          id: string
          message: string
          sender: string
          sent_at: string
        }
        Insert: {
          chat_id: string
          id?: string
          message: string
          sender?: string
          sent_at?: string
        }
        Update: {
          chat_id?: string
          id?: string
          message?: string
          sender?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cs_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "cs_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      defects: {
        Row: {
          company: string | null
          content: string
          created_at: string
          defect_type: string
          id: string
          photos: string[] | null
          report_date: string
          status: string
          unit_id: string
          updated_at: string
          visit_date: string | null
        }
        Insert: {
          company?: string | null
          content: string
          created_at?: string
          defect_type?: string
          id?: string
          photos?: string[] | null
          report_date?: string
          status?: string
          unit_id: string
          updated_at?: string
          visit_date?: string | null
        }
        Update: {
          company?: string | null
          content?: string
          created_at?: string
          defect_type?: string
          id?: string
          photos?: string[] | null
          report_date?: string
          status?: string
          unit_id?: string
          updated_at?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "defects_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          checkin_time: string | null
          created_at: string
          defect_count: number | null
          id: string
          inspection_date: string
          status: string
          time_slot: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          checkin_time?: string | null
          created_at?: string
          defect_count?: number | null
          id?: string
          inspection_date?: string
          status?: string
          time_slot: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          checkin_time?: string | null
          created_at?: string
          defect_count?: number | null
          id?: string
          inspection_date?: string
          status?: string
          time_slot?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      moving_schedules: {
        Row: {
          created_at: string
          elevator: string | null
          id: string
          moving_date: string
          status: string
          time_slot: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          elevator?: string | null
          id?: string
          moving_date: string
          status?: string
          time_slot?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          elevator?: string | null
          id?: string
          moving_date?: string
          status?: string
          time_slot?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moving_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string
          id: string
          read_rate: number | null
          scheduled_at: string | null
          send_method: string | null
          sent_date: string
          site_id: string
          status: string
          target_count: number | null
          target_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          read_rate?: number | null
          scheduled_at?: string | null
          send_method?: string | null
          sent_date?: string
          site_id: string
          status?: string
          target_count?: number | null
          target_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          read_rate?: number | null
          scheduled_at?: string | null
          send_method?: string | null
          sent_date?: string
          site_id?: string
          status?: string
          target_count?: number | null
          target_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          balance: number | null
          confirm_status: string
          created_at: string
          etc_amount: number | null
          extension_amount: number | null
          id: string
          mid_payment_status: string | null
          notification_sent_at: string | null
          option_amount: number | null
          paid_at: string | null
          status: string
          total_amount: number | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          balance?: number | null
          confirm_status?: string
          created_at?: string
          etc_amount?: number | null
          extension_amount?: number | null
          id?: string
          mid_payment_status?: string | null
          notification_sent_at?: string | null
          option_amount?: number | null
          paid_at?: string | null
          status?: string
          total_amount?: number | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          balance?: number | null
          confirm_status?: string
          created_at?: string
          etc_amount?: number | null
          extension_amount?: number | null
          id?: string
          mid_payment_status?: string | null
          notification_sent_at?: string | null
          option_amount?: number | null
          paid_at?: string | null
          status?: string
          total_amount?: number | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      permits: {
        Row: {
          created_at: string
          id: string
          issued_at: string | null
          qr_code: string | null
          status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          issued_at?: string | null
          qr_code?: string | null
          status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          issued_at?: string | null
          qr_code?: string | null
          status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      residents: {
        Row: {
          created_at: string
          email: string | null
          id: string
          inspection_status: string
          moving_date: string | null
          name: string
          phone: string | null
          qr_status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          inspection_status?: string
          moving_date?: string | null
          name: string
          phone?: string | null
          qr_status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          inspection_status?: string
          moving_date?: string | null
          name?: string
          phone?: string | null
          qr_status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "residents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          constructor_name: string | null
          created_at: string
          developer_name: string | null
          dong_count: number | null
          id: string
          move_in_end: string | null
          move_in_start: string | null
          name: string
          status: string
          total_units: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          constructor_name?: string | null
          created_at?: string
          developer_name?: string | null
          dong_count?: number | null
          id?: string
          move_in_end?: string | null
          move_in_start?: string | null
          name: string
          status?: string
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          constructor_name?: string | null
          created_at?: string
          developer_name?: string | null
          dong_count?: number | null
          id?: string
          move_in_end?: string | null
          move_in_start?: string | null
          name?: string
          status?: string
          total_units?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          area: string | null
          created_at: string
          dong: string
          ho: string
          id: string
          moving_status: string
          payment_status: string
          permit_status: string
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          dong: string
          ho: string
          id?: string
          moving_status?: string
          payment_status?: string
          permit_status?: string
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          dong?: string
          ho?: string
          id?: string
          moving_status?: string
          payment_status?: string
          permit_status?: string
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          car_model: string | null
          created_at: string
          expiry_date: string | null
          id: string
          plate: string
          qr_issued_date: string | null
          qr_status: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          car_model?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          plate: string
          qr_issued_date?: string | null
          qr_status?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          car_model?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          plate?: string
          qr_issued_date?: string | null
          qr_status?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "site_manager"
        | "cs_agent"
        | "developer"
        | "contractor"
        | "cs_center"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "site_manager",
        "cs_agent",
        "developer",
        "contractor",
        "cs_center",
      ],
    },
  },
} as const
