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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          church_id: string | null
          content: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          church_id?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          church_id?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      churches: {
        Row: {
          access_code: string
          created_at: string | null
          id: string
          leader_id: string | null
          name: string
        }
        Insert: {
          access_code: string
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name: string
        }
        Update: {
          access_code?: string
          created_at?: string | null
          id?: string
          leader_id?: string | null
          name?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          church_id: string | null
          created_at: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          title: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_type: string
          id: string
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_type?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_type?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          church_id: string | null
          created_at: string | null
          diarized_transcript: string | null
          id: string
          is_active: boolean | null
          leader_id: string | null
          transcript: string | null
        }
        Insert: {
          church_id?: string | null
          created_at?: string | null
          diarized_transcript?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          transcript?: string | null
        }
        Update: {
          church_id?: string | null
          created_at?: string | null
          diarized_transcript?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_interactions: {
        Row: {
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_interactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          content: string
          created_at: string
          display_name: string | null
          id: string
          is_anonymous: boolean
          prayed_count: number
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          prayed_count?: number
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          prayed_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bible_translation: string | null
          church_id: string | null
          church_name: string | null
          created_at: string
          denomination: string
          display_name: string | null
          font_size: string
          id: string
          last_visit_date: string | null
          role: string | null
          streak: number
          theme: string
        }
        Insert: {
          bible_translation?: string | null
          church_id?: string | null
          church_name?: string | null
          created_at?: string
          denomination: string
          display_name?: string | null
          font_size?: string
          id: string
          last_visit_date?: string | null
          role?: string | null
          streak?: number
          theme?: string
        }
        Update: {
          bible_translation?: string | null
          church_id?: string | null
          church_name?: string | null
          created_at?: string
          denomination?: string
          display_name?: string | null
          font_size?: string
          id?: string
          last_visit_date?: string | null
          role?: string | null
          streak?: number
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          id: string
          plan_data: Json
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          plan_data: Json
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          plan_data?: Json
          title?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          completed_days: number[]
          id: string
          plan_id: string
          start_date: string
          user_id: string
        }
        Insert: {
          completed_days?: number[]
          id?: string
          plan_id: string
          start_date: string
          user_id: string
        }
        Update: {
          completed_days?: number[]
          id?: string
          plan_id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_prayed_count: {
        Args: { request_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
