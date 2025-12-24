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
      assets: {
        Row: {
          bucket: string
          created_at: string | null
          id: string
          kind: string | null
          meta: Json | null
          path: string
          tags: string[] | null
          title: string | null
          user_id: string
        }
        Insert: {
          bucket: string
          created_at?: string | null
          id?: string
          kind?: string | null
          meta?: Json | null
          path: string
          tags?: string[] | null
          title?: string | null
          user_id: string
        }
        Update: {
          bucket?: string
          created_at?: string | null
          id?: string
          kind?: string | null
          meta?: Json | null
          path?: string
          tags?: string[] | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audits: {
        Row: {
          created_at: string | null
          id: string
          input_url: string | null
          notes: string | null
          output_content_item_id: string | null
          requester_handle: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          input_url?: string | null
          notes?: string | null
          output_content_item_id?: string | null
          requester_handle?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          input_url?: string | null
          notes?: string | null
          output_content_item_id?: string | null
          requester_handle?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_output_content_run_id_fkey"
            columns: ["output_content_item_id"]
            isOneToOne: false
            referencedRelation: "content_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          brand_assets: Json
          created_at: string | null
          naming_convention: string | null
          palette: Json
          rules: Json
          typography: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand_assets?: Json
          created_at?: string | null
          naming_convention?: string | null
          palette?: Json
          rules?: Json
          typography?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand_assets?: Json
          created_at?: string | null
          naming_convention?: string | null
          palette?: Json
          rules?: Json
          typography?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      content_runs: {
        Row: {
          brief_json: Json | null
          content_type: string
          created_at: string
          hook: string | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          one_pager_error: string | null
          one_pager_json: Json | null
          one_pager_status: string | null
          one_pager_text: string | null
          script_json: Json | null
          script_text: string | null
          series: string
          status: string
          target_audience: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brief_json?: Json | null
          content_type: string
          created_at?: string
          hook?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          one_pager_error?: string | null
          one_pager_json?: Json | null
          one_pager_status?: string | null
          one_pager_text?: string | null
          script_json?: Json | null
          script_text?: string | null
          series: string
          status?: string
          target_audience: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brief_json?: Json | null
          content_type?: string
          created_at?: string
          hook?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          one_pager_error?: string | null
          one_pager_json?: Json | null
          one_pager_status?: string | null
          one_pager_text?: string | null
          script_json?: Json | null
          script_text?: string | null
          series?: string
          status?: string
          target_audience?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      designs: {
        Row: {
          content_item_id: string
          created_at: string | null
          design_json: Json | null
          format: string | null
          id: string
          rendered_asset_id: string | null
          template_id: string | null
        }
        Insert: {
          content_item_id: string
          created_at?: string | null
          design_json?: Json | null
          format?: string | null
          id?: string
          rendered_asset_id?: string | null
          template_id?: string | null
        }
        Update: {
          content_item_id?: string
          created_at?: string | null
          design_json?: Json | null
          format?: string | null
          id?: string
          rendered_asset_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designs_content_run_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_rendered_asset_id_fkey"
            columns: ["rendered_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "designs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_keywords: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          keyword: string
          last_triggered_at: string | null
          match_type: string | null
          response_template: string | null
          trigger_count: number | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          keyword: string
          last_triggered_at?: string | null
          match_type?: string | null
          response_template?: string | null
          trigger_count?: number | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          keyword?: string
          last_triggered_at?: string | null
          match_type?: string | null
          response_template?: string | null
          trigger_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          id: string
          keyword: string | null
          notes: string | null
          occurred_at: string
          platform: string | null
          post_id: string | null
          related_event_id: string | null
          type: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          keyword?: string | null
          notes?: string | null
          occurred_at?: string
          platform?: string | null
          post_id?: string | null
          related_event_id?: string | null
          type: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string | null
          notes?: string | null
          occurred_at?: string
          platform?: string | null
          post_id?: string | null
          related_event_id?: string | null
          type?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          asset_id: string | null
          content_item_id: string | null
          created_at: string | null
          filename: string | null
          format: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          content_item_id?: string | null
          created_at?: string | null
          filename?: string | null
          format: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          content_item_id?: string | null
          created_at?: string | null
          filename?: string | null
          format?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exports_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exports_content_run_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      one_pagers: {
        Row: {
          blocks: Json | null
          content_item_id: string
          created_at: string | null
          id: string
          markdown: string | null
        }
        Insert: {
          blocks?: Json | null
          content_item_id: string
          created_at?: string | null
          id?: string
          markdown?: string | null
        }
        Update: {
          blocks?: Json | null
          content_item_id?: string
          created_at?: string | null
          id?: string
          markdown?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_pagers_content_run_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_cards: {
        Row: {
          asset_id: string | null
          claim: string
          client_name: string | null
          created_at: string
          id: string
          metric: string | null
          proof_id: string | null
          proof_type: string | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          claim: string
          client_name?: string | null
          created_at?: string
          id?: string
          metric?: string | null
          proof_id?: string | null
          proof_type?: string | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string | null
          claim?: string
          client_name?: string | null
          created_at?: string
          id?: string
          metric?: string | null
          proof_id?: string | null
          proof_type?: string | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_cards_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_cards_proof_id_fkey"
            columns: ["proof_id"]
            isOneToOne: false
            referencedRelation: "proofs"
            referencedColumns: ["id"]
          },
        ]
      }
      proofs: {
        Row: {
          created_at: string | null
          happened_at: string | null
          headline: string
          id: string
          industry: string | null
          is_blurred: boolean | null
          metric: string | null
          score: number | null
          screenshot_asset_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          happened_at?: string | null
          headline: string
          id?: string
          industry?: string | null
          is_blurred?: boolean | null
          metric?: string | null
          score?: number | null
          screenshot_asset_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          happened_at?: string | null
          headline?: string
          id?: string
          industry?: string | null
          is_blurred?: boolean | null
          metric?: string | null
          score?: number | null
          screenshot_asset_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proofs_screenshot_asset_id_fkey"
            columns: ["screenshot_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_posts: {
        Row: {
          asset_ids: string[] | null
          content_item_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          platform: string | null
          post_type: string
          proof_card_id: string | null
          scheduled_for: string
          status: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          asset_ids?: string[] | null
          content_item_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          platform?: string | null
          post_type: string
          proof_card_id?: string | null
          scheduled_for: string
          status?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          asset_ids?: string[] | null
          content_item_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          platform?: string | null
          post_type?: string
          proof_card_id?: string | null
          scheduled_for?: string
          status?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_content_run_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_proof_card_id_fkey"
            columns: ["proof_card_id"]
            isOneToOne: false
            referencedRelation: "proof_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          content_item_id: string
          created_at: string | null
          est_seconds: number | null
          id: string
          text: string
          word_count: number | null
        }
        Insert: {
          content_item_id: string
          created_at?: string | null
          est_seconds?: number | null
          id?: string
          text: string
          word_count?: number | null
        }
        Update: {
          content_item_id?: string
          created_at?: string | null
          est_seconds?: number | null
          id?: string
          text?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_content_run_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          config_schema: Json | null
          created_at: string | null
          description: string | null
          formats: string[] | null
          id: string
          is_system: boolean | null
          key: string
          name: string
          preview_asset_path: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          formats?: string[] | null
          id?: string
          is_system?: boolean | null
          key: string
          name: string
          preview_asset_path?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          formats?: string[] | null
          id?: string
          is_system?: boolean | null
          key?: string
          name?: string
          preview_asset_path?: string | null
          user_id?: string | null
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
