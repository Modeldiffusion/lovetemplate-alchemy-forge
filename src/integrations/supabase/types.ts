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
      extracted_tags: {
        Row: {
          confidence: number
          context: string | null
          extracted_at: string
          extracted_by: string | null
          id: string
          pattern: string | null
          position: number
          template_id: string
          text: string
          updated_at: string
        }
        Insert: {
          confidence?: number
          context?: string | null
          extracted_at?: string
          extracted_by?: string | null
          id?: string
          pattern?: string | null
          position?: number
          template_id: string
          text: string
          updated_at?: string
        }
        Update: {
          confidence?: number
          context?: string | null
          extracted_at?: string
          extracted_by?: string | null
          id?: string
          pattern?: string | null
          position?: number
          template_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_tags_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_tags: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          data_type: string
          default_value: string | null
          description: string | null
          id: string
          is_required: boolean
          name: string
          updated_at: string
          validation: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          data_type?: string
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          name: string
          updated_at?: string
          validation?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          data_type?: string
          default_value?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          name?: string
          updated_at?: string
          validation?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tag_mappings: {
        Row: {
          confidence: number
          created_at: string
          created_by: string | null
          extracted_tag_id: string
          id: string
          internal_tag_id: string | null
          mapping_logic: string | null
          status: string
          updated_at: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          created_by?: string | null
          extracted_tag_id: string
          id?: string
          internal_tag_id?: string | null
          mapping_logic?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          created_by?: string | null
          extracted_tag_id?: string
          id?: string
          internal_tag_id?: string | null
          mapping_logic?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_mappings_extracted_tag_id_fkey"
            columns: ["extracted_tag_id"]
            isOneToOne: false
            referencedRelation: "extracted_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_mappings_internal_tag_id_fkey"
            columns: ["internal_tag_id"]
            isOneToOne: false
            referencedRelation: "internal_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          name: string
          status: string
          tags: string[] | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          name: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
