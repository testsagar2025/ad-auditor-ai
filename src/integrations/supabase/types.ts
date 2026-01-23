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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_path: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_path?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_path?: string | null
        }
        Relationships: []
      }
      ccpa_reports: {
        Row: {
          conflict_id: string | null
          generated_at: string
          id: string
          institute_id: string | null
          pdf_url: string | null
          report_data: Json
        }
        Insert: {
          conflict_id?: string | null
          generated_at?: string
          id?: string
          institute_id?: string | null
          pdf_url?: string | null
          report_data: Json
        }
        Update: {
          conflict_id?: string | null
          generated_at?: string
          id?: string
          institute_id?: string | null
          pdf_url?: string | null
          report_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ccpa_reports_conflict_id_fkey"
            columns: ["conflict_id"]
            isOneToOne: false
            referencedRelation: "conflicts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ccpa_reports_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "coaching_institutes"
            referencedColumns: ["id"]
          },
        ]
      }
      coaching_institutes: {
        Row: {
          conflicted_claims: number
          course_category: string | null
          created_at: string
          deception_score: number
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          total_claims: number
          updated_at: string
          verified_claims: number
        }
        Insert: {
          conflicted_claims?: number
          course_category?: string | null
          created_at?: string
          deception_score?: number
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          total_claims?: number
          updated_at?: string
          verified_claims?: number
        }
        Update: {
          conflicted_claims?: number
          course_category?: string | null
          created_at?: string
          deception_score?: number
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          total_claims?: number
          updated_at?: string
          verified_claims?: number
        }
        Relationships: []
      }
      conflicts: {
        Row: {
          claim_ids: string[]
          created_at: string
          exam_name: string | null
          exam_year: number | null
          id: string
          institute_ids: string[]
          rank_claimed: string
          severity: string
          status: string
          topper_name: string
          updated_at: string
        }
        Insert: {
          claim_ids: string[]
          created_at?: string
          exam_name?: string | null
          exam_year?: number | null
          id?: string
          institute_ids: string[]
          rank_claimed: string
          severity?: string
          status?: string
          topper_name: string
          updated_at?: string
        }
        Update: {
          claim_ids?: string[]
          created_at?: string
          exam_name?: string | null
          exam_year?: number | null
          id?: string
          institute_ids?: string[]
          rank_claimed?: string
          severity?: string
          status?: string
          topper_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      topper_claims: {
        Row: {
          ad_date: string | null
          course_category: string | null
          created_at: string
          exam_name: string | null
          exam_year: number | null
          extracted_text: string | null
          fine_print: string | null
          has_conflict: boolean
          id: string
          institute_id: string | null
          is_verified: boolean
          newspaper_image_url: string
          newspaper_name: string | null
          rank_claimed: string
          topper_name: string
        }
        Insert: {
          ad_date?: string | null
          course_category?: string | null
          created_at?: string
          exam_name?: string | null
          exam_year?: number | null
          extracted_text?: string | null
          fine_print?: string | null
          has_conflict?: boolean
          id?: string
          institute_id?: string | null
          is_verified?: boolean
          newspaper_image_url: string
          newspaper_name?: string | null
          rank_claimed: string
          topper_name: string
        }
        Update: {
          ad_date?: string | null
          course_category?: string | null
          created_at?: string
          exam_name?: string | null
          exam_year?: number | null
          extracted_text?: string | null
          fine_print?: string | null
          has_conflict?: boolean
          id?: string
          institute_id?: string | null
          is_verified?: boolean
          newspaper_image_url?: string
          newspaper_name?: string | null
          rank_claimed?: string
          topper_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "topper_claims_institute_id_fkey"
            columns: ["institute_id"]
            isOneToOne: false
            referencedRelation: "coaching_institutes"
            referencedColumns: ["id"]
          },
        ]
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
