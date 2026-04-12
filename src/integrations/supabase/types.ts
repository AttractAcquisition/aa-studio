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
      aa_scene_plans: {
        Row: {
          created_at: string | null
          duration_sec: number | null
          id: string
          is_approved: boolean | null
          plan_json: Json
          script_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          is_approved?: boolean | null
          plan_json: Json
          script_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_sec?: number | null
          id?: string
          is_approved?: boolean | null
          plan_json?: Json
          script_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aa_scene_plans_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "aa_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      aa_scripts: {
        Row: {
          created_at: string | null
          id: string
          script: string
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          script: string
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          script?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      aa_video_renders: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          plan_id: string
          renderer_job_id: string | null
          script_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          plan_id: string
          renderer_job_id?: string | null
          script_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          plan_id?: string
          renderer_job_id?: string | null
          script_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aa_video_renders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "aa_scene_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aa_video_renders_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "aa_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      brand_presets: {
        Row: {
          created_at: string
          font_primary: string | null
          font_secondary: string | null
          id: string
          logo_secondary_url: string | null
          logo_url: string | null
          preset_json: Json | null
          prompt_rules: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font_primary?: string | null
          font_secondary?: string | null
          id?: string
          logo_secondary_url?: string | null
          logo_url?: string | null
          preset_json?: Json | null
          prompt_rules?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font_primary?: string | null
          font_secondary?: string | null
          id?: string
          logo_secondary_url?: string | null
          logo_url?: string | null
          preset_json?: Json | null
          prompt_rules?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      content_bundles: {
        Row: {
          audience: string | null
          caption: string | null
          content_type: string | null
          created_at: string
          cta: string | null
          design_image_urls: Json | null
          design_prompts: Json | null
          export_urls: Json | null
          hook: string | null
          id: string
          one_pager_export_png_url: string | null
          one_pager_layout_json: Json | null
          published_at: string | null
          scheduled_at: string | null
          script: string | null
          series: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string
          cta?: string | null
          design_image_urls?: Json | null
          design_prompts?: Json | null
          export_urls?: Json | null
          hook?: string | null
          id?: string
          one_pager_export_png_url?: string | null
          one_pager_layout_json?: Json | null
          published_at?: string | null
          scheduled_at?: string | null
          script?: string | null
          series?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string
          cta?: string | null
          design_image_urls?: Json | null
          design_prompts?: Json | null
          export_urls?: Json | null
          hook?: string | null
          id?: string
          one_pager_export_png_url?: string | null
          one_pager_layout_json?: Json | null
          published_at?: string | null
          scheduled_at?: string | null
          script?: string | null
          series?: string | null
          status?: string
          title?: string
          updated_at?: string
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
          contact_handle: string | null
          contact_name: string | null
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
          contact_handle?: string | null
          contact_name?: string | null
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
          contact_handle?: string | null
          contact_name?: string | null
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
      growth_metrics_daily: {
        Row: {
          booked_calls: number | null
          created_at: string
          date: string
          followers: number | null
          id: string
          inbound_dms: number | null
          link_clicks: number | null
          profile_visits: number | null
          user_id: string
        }
        Insert: {
          booked_calls?: number | null
          created_at?: string
          date: string
          followers?: number | null
          id?: string
          inbound_dms?: number | null
          link_clicks?: number | null
          profile_visits?: number | null
          user_id: string
        }
        Update: {
          booked_calls?: number | null
          created_at?: string
          date?: string
          followers?: number | null
          id?: string
          inbound_dms?: number | null
          link_clicks?: number | null
          profile_visits?: number | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          api_key: string | null
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
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
      one_pagers_v2: {
        Row: {
          created_at: string
          export_png_url: string | null
          id: string
          layout_json: Json
          source_script_id: string | null
          tags: string[] | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          export_png_url?: string | null
          id?: string
          layout_json: Json
          source_script_id?: string | null
          tags?: string[] | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          export_png_url?: string | null
          id?: string
          layout_json?: Json
          source_script_id?: string | null
          tags?: string[] | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portal_attraction_system: {
        Row: {
          ad_account_status: string | null
          approval_gate_passed: boolean | null
          attraction_plan_approved: boolean | null
          attraction_strategy_summary: string | null
          blockers_note: string | null
          brand_assets_link: string | null
          brand_assets_received: boolean | null
          budget_range: string | null
          campaign_or_organic_active: boolean | null
          campaigns_live: boolean | null
          constraints: string | null
          content_angles: string | null
          content_pillars: string | null
          content_plan_doc_link: string | null
          created_at: string | null
          creative_notes: string | null
          creative_pack_approved: boolean | null
          creative_pack_link: string | null
          creative_pack_scope: string | null
          id: string
          kpi_targets: string | null
          lead_destination: string | null
          payment_method: string | null
          performance_snapshot_link: string | null
          positioning_notes: string | null
          posting_structure: string | null
          primary_offer: string | null
          proof_link: string | null
          proof_received: boolean | null
          reporting_cadence: string | null
          retargeting_enabled: boolean | null
          retargeting_notes: string | null
          running_ads: boolean | null
          service_area: string | null
          target_audience: string | null
          tracking_reporting_confirmed: boolean | null
          tracking_setup_confirmed: boolean | null
          updated_at: string | null
          user_id: string
          weekly_iteration_notes: string | null
        }
        Insert: {
          ad_account_status?: string | null
          approval_gate_passed?: boolean | null
          attraction_plan_approved?: boolean | null
          attraction_strategy_summary?: string | null
          blockers_note?: string | null
          brand_assets_link?: string | null
          brand_assets_received?: boolean | null
          budget_range?: string | null
          campaign_or_organic_active?: boolean | null
          campaigns_live?: boolean | null
          constraints?: string | null
          content_angles?: string | null
          content_pillars?: string | null
          content_plan_doc_link?: string | null
          created_at?: string | null
          creative_notes?: string | null
          creative_pack_approved?: boolean | null
          creative_pack_link?: string | null
          creative_pack_scope?: string | null
          id?: string
          kpi_targets?: string | null
          lead_destination?: string | null
          payment_method?: string | null
          performance_snapshot_link?: string | null
          positioning_notes?: string | null
          posting_structure?: string | null
          primary_offer?: string | null
          proof_link?: string | null
          proof_received?: boolean | null
          reporting_cadence?: string | null
          retargeting_enabled?: boolean | null
          retargeting_notes?: string | null
          running_ads?: boolean | null
          service_area?: string | null
          target_audience?: string | null
          tracking_reporting_confirmed?: boolean | null
          tracking_setup_confirmed?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_iteration_notes?: string | null
        }
        Update: {
          ad_account_status?: string | null
          approval_gate_passed?: boolean | null
          attraction_plan_approved?: boolean | null
          attraction_strategy_summary?: string | null
          blockers_note?: string | null
          brand_assets_link?: string | null
          brand_assets_received?: boolean | null
          budget_range?: string | null
          campaign_or_organic_active?: boolean | null
          campaigns_live?: boolean | null
          constraints?: string | null
          content_angles?: string | null
          content_pillars?: string | null
          content_plan_doc_link?: string | null
          created_at?: string | null
          creative_notes?: string | null
          creative_pack_approved?: boolean | null
          creative_pack_link?: string | null
          creative_pack_scope?: string | null
          id?: string
          kpi_targets?: string | null
          lead_destination?: string | null
          payment_method?: string | null
          performance_snapshot_link?: string | null
          positioning_notes?: string | null
          posting_structure?: string | null
          primary_offer?: string | null
          proof_link?: string | null
          proof_received?: boolean | null
          reporting_cadence?: string | null
          retargeting_enabled?: boolean | null
          retargeting_notes?: string | null
          running_ads?: boolean | null
          service_area?: string | null
          target_audience?: string | null
          tracking_reporting_confirmed?: boolean | null
          tracking_setup_confirmed?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_iteration_notes?: string | null
        }
        Relationships: []
      }
      portal_client_onboarding: {
        Row: {
          access_checklist_link: string | null
          access_pending_items: string | null
          access_status: string | null
          access_verified: boolean | null
          blockers_note: string | null
          call_completed: boolean | null
          call_link: string | null
          capacity_confirmed: boolean | null
          capacity_per_week: number | null
          client_brief_link: string | null
          constraints: string | null
          created_at: string | null
          delivery_timeline_link: string | null
          drive_folder_link: string | null
          id: string
          lead_destination_confirmed: boolean | null
          lead_destination_link: string | null
          lead_destination_type: string | null
          offer_confirmed: boolean | null
          onboarding_summary_link: string | null
          positioning_approved: boolean | null
          positioning_statement: string | null
          pricing_confirmed: boolean | null
          pricing_summary: string | null
          primary_offer_name: string | null
          primary_offer_notes: string | null
          promotions_seasonality: string | null
          target_audience_summary: string | null
          timeline_confirmed: boolean | null
          tracking_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_checklist_link?: string | null
          access_pending_items?: string | null
          access_status?: string | null
          access_verified?: boolean | null
          blockers_note?: string | null
          call_completed?: boolean | null
          call_link?: string | null
          capacity_confirmed?: boolean | null
          capacity_per_week?: number | null
          client_brief_link?: string | null
          constraints?: string | null
          created_at?: string | null
          delivery_timeline_link?: string | null
          drive_folder_link?: string | null
          id?: string
          lead_destination_confirmed?: boolean | null
          lead_destination_link?: string | null
          lead_destination_type?: string | null
          offer_confirmed?: boolean | null
          onboarding_summary_link?: string | null
          positioning_approved?: boolean | null
          positioning_statement?: string | null
          pricing_confirmed?: boolean | null
          pricing_summary?: string | null
          primary_offer_name?: string | null
          primary_offer_notes?: string | null
          promotions_seasonality?: string | null
          target_audience_summary?: string | null
          timeline_confirmed?: boolean | null
          tracking_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_checklist_link?: string | null
          access_pending_items?: string | null
          access_status?: string | null
          access_verified?: boolean | null
          blockers_note?: string | null
          call_completed?: boolean | null
          call_link?: string | null
          capacity_confirmed?: boolean | null
          capacity_per_week?: number | null
          client_brief_link?: string | null
          constraints?: string | null
          created_at?: string | null
          delivery_timeline_link?: string | null
          drive_folder_link?: string | null
          id?: string
          lead_destination_confirmed?: boolean | null
          lead_destination_link?: string | null
          lead_destination_type?: string | null
          offer_confirmed?: boolean | null
          onboarding_summary_link?: string | null
          positioning_approved?: boolean | null
          positioning_statement?: string | null
          pricing_confirmed?: boolean | null
          pricing_summary?: string | null
          primary_offer_name?: string | null
          primary_offer_notes?: string | null
          promotions_seasonality?: string | null
          target_audience_summary?: string | null
          timeline_confirmed?: boolean | null
          tracking_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portal_clients: {
        Row: {
          business_description: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          notes: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          business_description?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          business_description?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      portal_conversion_system: {
        Row: {
          approval_gate_passed: boolean | null
          availability_windows: string | null
          blockers_note: string | null
          booked_rate_target: string | null
          booking_flow_approved: boolean | null
          booking_friction_fixes: string | null
          closing_script: string | null
          confirmation_messages: string | null
          constraints: string | null
          conversion_flow_steps: string | null
          created_at: string | null
          cta_next_step: string | null
          current_booking_links: string | null
          current_booking_tools: string | null
          deposit_rules: string | null
          dropoff_points: string | null
          flow_doc_link: string | null
          id: string
          lead_response_coverage: string | null
          messages_doc_link: string | null
          objection_handling_script: string | null
          payment_method: string | null
          preferred_booking_method: string | null
          preframe_messages: string | null
          pricing_process_current: string | null
          qualifying_script: string | null
          reminder_messages: string | null
          reminders_approved: boolean | null
          scripts_approved: boolean | null
          scripts_doc_link: string | null
          show_rate_target: string | null
          tracking_confirmed: boolean | null
          tracking_link: string | null
          tracking_method: string | null
          tracking_notes_template: string | null
          updated_at: string | null
          user_id: string
          uses_deposit: boolean | null
        }
        Insert: {
          approval_gate_passed?: boolean | null
          availability_windows?: string | null
          blockers_note?: string | null
          booked_rate_target?: string | null
          booking_flow_approved?: boolean | null
          booking_friction_fixes?: string | null
          closing_script?: string | null
          confirmation_messages?: string | null
          constraints?: string | null
          conversion_flow_steps?: string | null
          created_at?: string | null
          cta_next_step?: string | null
          current_booking_links?: string | null
          current_booking_tools?: string | null
          deposit_rules?: string | null
          dropoff_points?: string | null
          flow_doc_link?: string | null
          id?: string
          lead_response_coverage?: string | null
          messages_doc_link?: string | null
          objection_handling_script?: string | null
          payment_method?: string | null
          preferred_booking_method?: string | null
          preframe_messages?: string | null
          pricing_process_current?: string | null
          qualifying_script?: string | null
          reminder_messages?: string | null
          reminders_approved?: boolean | null
          scripts_approved?: boolean | null
          scripts_doc_link?: string | null
          show_rate_target?: string | null
          tracking_confirmed?: boolean | null
          tracking_link?: string | null
          tracking_method?: string | null
          tracking_notes_template?: string | null
          updated_at?: string | null
          user_id: string
          uses_deposit?: boolean | null
        }
        Update: {
          approval_gate_passed?: boolean | null
          availability_windows?: string | null
          blockers_note?: string | null
          booked_rate_target?: string | null
          booking_flow_approved?: boolean | null
          booking_friction_fixes?: string | null
          closing_script?: string | null
          confirmation_messages?: string | null
          constraints?: string | null
          conversion_flow_steps?: string | null
          created_at?: string | null
          cta_next_step?: string | null
          current_booking_links?: string | null
          current_booking_tools?: string | null
          deposit_rules?: string | null
          dropoff_points?: string | null
          flow_doc_link?: string | null
          id?: string
          lead_response_coverage?: string | null
          messages_doc_link?: string | null
          objection_handling_script?: string | null
          payment_method?: string | null
          preferred_booking_method?: string | null
          preframe_messages?: string | null
          pricing_process_current?: string | null
          qualifying_script?: string | null
          reminder_messages?: string | null
          reminders_approved?: boolean | null
          scripts_approved?: boolean | null
          scripts_doc_link?: string | null
          show_rate_target?: string | null
          tracking_confirmed?: boolean | null
          tracking_link?: string | null
          tracking_method?: string | null
          tracking_notes_template?: string | null
          updated_at?: string | null
          user_id?: string
          uses_deposit?: boolean | null
        }
        Relationships: []
      }
      portal_dwy_call_1: {
        Row: {
          access_checklist_confirmed: boolean | null
          access_checklist_items: string | null
          access_checklist_link: string | null
          access_notes: string | null
          access_status: string | null
          approval_gate_passed: boolean | null
          approval_method: string | null
          approved_build_plan_link: string | null
          attendees_confirmed: boolean | null
          audit_reviewed: boolean | null
          backup_comm_channel: string | null
          biggest_bottleneck: string | null
          blockers_note: string | null
          build_order: string | null
          build_plan_approved: boolean | null
          call_datetime: string | null
          call_link: string | null
          call_notes_link: string | null
          call_scheduled: boolean | null
          constraints: string | null
          created_at: string | null
          deadlines: string | null
          good_lead_definition: string | null
          good_lead_definition_locked: boolean | null
          id: string
          next_steps_48h_link: string | null
          next_steps_confirmed: boolean | null
          owners: string | null
          primary_comm_channel: string | null
          primary_offer_confirmed: boolean | null
          primary_offer_name: string | null
          priorities: string | null
          recording_link: string | null
          response_expectations_confirmed: boolean | null
          service_area_confirmed: boolean | null
          service_area_details: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_checklist_confirmed?: boolean | null
          access_checklist_items?: string | null
          access_checklist_link?: string | null
          access_notes?: string | null
          access_status?: string | null
          approval_gate_passed?: boolean | null
          approval_method?: string | null
          approved_build_plan_link?: string | null
          attendees_confirmed?: boolean | null
          audit_reviewed?: boolean | null
          backup_comm_channel?: string | null
          biggest_bottleneck?: string | null
          blockers_note?: string | null
          build_order?: string | null
          build_plan_approved?: boolean | null
          call_datetime?: string | null
          call_link?: string | null
          call_notes_link?: string | null
          call_scheduled?: boolean | null
          constraints?: string | null
          created_at?: string | null
          deadlines?: string | null
          good_lead_definition?: string | null
          good_lead_definition_locked?: boolean | null
          id?: string
          next_steps_48h_link?: string | null
          next_steps_confirmed?: boolean | null
          owners?: string | null
          primary_comm_channel?: string | null
          primary_offer_confirmed?: boolean | null
          primary_offer_name?: string | null
          priorities?: string | null
          recording_link?: string | null
          response_expectations_confirmed?: boolean | null
          service_area_confirmed?: boolean | null
          service_area_details?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_checklist_confirmed?: boolean | null
          access_checklist_items?: string | null
          access_checklist_link?: string | null
          access_notes?: string | null
          access_status?: string | null
          approval_gate_passed?: boolean | null
          approval_method?: string | null
          approved_build_plan_link?: string | null
          attendees_confirmed?: boolean | null
          audit_reviewed?: boolean | null
          backup_comm_channel?: string | null
          biggest_bottleneck?: string | null
          blockers_note?: string | null
          build_order?: string | null
          build_plan_approved?: boolean | null
          call_datetime?: string | null
          call_link?: string | null
          call_notes_link?: string | null
          call_scheduled?: boolean | null
          constraints?: string | null
          created_at?: string | null
          deadlines?: string | null
          good_lead_definition?: string | null
          good_lead_definition_locked?: boolean | null
          id?: string
          next_steps_48h_link?: string | null
          next_steps_confirmed?: boolean | null
          owners?: string | null
          primary_comm_channel?: string | null
          primary_offer_confirmed?: boolean | null
          primary_offer_name?: string | null
          priorities?: string | null
          recording_link?: string | null
          response_expectations_confirmed?: boolean | null
          service_area_confirmed?: boolean | null
          service_area_details?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portal_dwy_call_2: {
        Row: {
          approval_gate_passed: boolean | null
          approval_method: string | null
          call_confirmed: boolean | null
          call_datetime: string | null
          call_link: string | null
          capacity_notes: string | null
          client_feedback_summary: string | null
          constraints_confirmed: boolean | null
          created_at: string | null
          examples_link: string | null
          great_leads_examples: string | null
          id: string
          iteration_plan_approved: boolean | null
          iteration_plan_summary: string | null
          iteration_priorities: string | null
          metrics_snapshot: string | null
          no_show_examples: string | null
          offer_pricing_updates: string | null
          operational_updates_noted: boolean | null
          optimization_actions: string | null
          period_end: string | null
          period_start: string | null
          plan_doc_link: string | null
          primary_constraint: string | null
          reporting_cadence: string | null
          reporting_cadence_confirmed: boolean | null
          reporting_confirmed: boolean | null
          review_doc_link: string | null
          staff_hours_notes: string | null
          system_review_summary: string | null
          test_priorities_confirmed: boolean | null
          tests_queue: string | null
          updated_at: string | null
          user_id: string
          weak_leads_examples: string | null
          weekly_checkin_notes: string | null
          what_is_not_working: string | null
          what_is_working: string | null
        }
        Insert: {
          approval_gate_passed?: boolean | null
          approval_method?: string | null
          call_confirmed?: boolean | null
          call_datetime?: string | null
          call_link?: string | null
          capacity_notes?: string | null
          client_feedback_summary?: string | null
          constraints_confirmed?: boolean | null
          created_at?: string | null
          examples_link?: string | null
          great_leads_examples?: string | null
          id?: string
          iteration_plan_approved?: boolean | null
          iteration_plan_summary?: string | null
          iteration_priorities?: string | null
          metrics_snapshot?: string | null
          no_show_examples?: string | null
          offer_pricing_updates?: string | null
          operational_updates_noted?: boolean | null
          optimization_actions?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_doc_link?: string | null
          primary_constraint?: string | null
          reporting_cadence?: string | null
          reporting_cadence_confirmed?: boolean | null
          reporting_confirmed?: boolean | null
          review_doc_link?: string | null
          staff_hours_notes?: string | null
          system_review_summary?: string | null
          test_priorities_confirmed?: boolean | null
          tests_queue?: string | null
          updated_at?: string | null
          user_id: string
          weak_leads_examples?: string | null
          weekly_checkin_notes?: string | null
          what_is_not_working?: string | null
          what_is_working?: string | null
        }
        Update: {
          approval_gate_passed?: boolean | null
          approval_method?: string | null
          call_confirmed?: boolean | null
          call_datetime?: string | null
          call_link?: string | null
          capacity_notes?: string | null
          client_feedback_summary?: string | null
          constraints_confirmed?: boolean | null
          created_at?: string | null
          examples_link?: string | null
          great_leads_examples?: string | null
          id?: string
          iteration_plan_approved?: boolean | null
          iteration_plan_summary?: string | null
          iteration_priorities?: string | null
          metrics_snapshot?: string | null
          no_show_examples?: string | null
          offer_pricing_updates?: string | null
          operational_updates_noted?: boolean | null
          optimization_actions?: string | null
          period_end?: string | null
          period_start?: string | null
          plan_doc_link?: string | null
          primary_constraint?: string | null
          reporting_cadence?: string | null
          reporting_cadence_confirmed?: boolean | null
          reporting_confirmed?: boolean | null
          review_doc_link?: string | null
          staff_hours_notes?: string | null
          system_review_summary?: string | null
          test_priorities_confirmed?: boolean | null
          tests_queue?: string | null
          updated_at?: string | null
          user_id?: string
          weak_leads_examples?: string | null
          weekly_checkin_notes?: string | null
          what_is_not_working?: string | null
          what_is_working?: string | null
        }
        Relationships: []
      }
      portal_funnel_audit: {
        Row: {
          ad_account_access_status: string | null
          ads_data_received: boolean | null
          ads_summary: string | null
          audit_complete: boolean | null
          audit_doc_link: string | null
          audit_scorecard: string | null
          blockers_note: string | null
          booking_link: string | null
          constraints: string | null
          conversations_received: boolean | null
          created_at: string | null
          creatives_received: boolean | null
          creatives_upload_link: string | null
          decision_notes: string | null
          entry_points_received: boolean | null
          fix_plan_approved: boolean | null
          fix_plan_link: string | null
          form_link: string | null
          good_lead_definition: string | null
          good_lead_definition_confirmed: boolean | null
          id: string
          instagram_url: string | null
          key_funnel_decision: string | null
          key_funnel_decision_confirmed: boolean | null
          lead_conversations_upload_link: string | null
          leak_list: string | null
          offer_details: string | null
          offer_details_received: boolean | null
          priority_fix_plan: string | null
          quick_wins: string | null
          scorecard_approved: boolean | null
          scorecard_link: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
          whatsapp_link: string | null
        }
        Insert: {
          ad_account_access_status?: string | null
          ads_data_received?: boolean | null
          ads_summary?: string | null
          audit_complete?: boolean | null
          audit_doc_link?: string | null
          audit_scorecard?: string | null
          blockers_note?: string | null
          booking_link?: string | null
          constraints?: string | null
          conversations_received?: boolean | null
          created_at?: string | null
          creatives_received?: boolean | null
          creatives_upload_link?: string | null
          decision_notes?: string | null
          entry_points_received?: boolean | null
          fix_plan_approved?: boolean | null
          fix_plan_link?: string | null
          form_link?: string | null
          good_lead_definition?: string | null
          good_lead_definition_confirmed?: boolean | null
          id?: string
          instagram_url?: string | null
          key_funnel_decision?: string | null
          key_funnel_decision_confirmed?: boolean | null
          lead_conversations_upload_link?: string | null
          leak_list?: string | null
          offer_details?: string | null
          offer_details_received?: boolean | null
          priority_fix_plan?: string | null
          quick_wins?: string | null
          scorecard_approved?: boolean | null
          scorecard_link?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          ad_account_access_status?: string | null
          ads_data_received?: boolean | null
          ads_summary?: string | null
          audit_complete?: boolean | null
          audit_doc_link?: string | null
          audit_scorecard?: string | null
          blockers_note?: string | null
          booking_link?: string | null
          constraints?: string | null
          conversations_received?: boolean | null
          created_at?: string | null
          creatives_received?: boolean | null
          creatives_upload_link?: string | null
          decision_notes?: string | null
          entry_points_received?: boolean | null
          fix_plan_approved?: boolean | null
          fix_plan_link?: string | null
          form_link?: string | null
          good_lead_definition?: string | null
          good_lead_definition_confirmed?: boolean | null
          id?: string
          instagram_url?: string | null
          key_funnel_decision?: string | null
          key_funnel_decision_confirmed?: boolean | null
          lead_conversations_upload_link?: string | null
          leak_list?: string | null
          offer_details?: string | null
          offer_details_received?: boolean | null
          priority_fix_plan?: string | null
          quick_wins?: string | null
          scorecard_approved?: boolean | null
          scorecard_link?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
          whatsapp_link?: string | null
        }
        Relationships: []
      }
      portal_get_started: {
        Row: {
          access_guide_link: string | null
          assets_folder_link: string | null
          assets_uploaded: boolean | null
          blocker_note: string | null
          booking_link: string | null
          created_at: string | null
          id: string
          intake_link: string | null
          intake_submitted: boolean | null
          meta_access_granted: boolean | null
          offer_confirmed: boolean | null
          proof_folder_link: string | null
          proof_uploaded: boolean | null
          service_area_confirmed: boolean | null
          updated_at: string | null
          user_id: string
          whatsapp_saved: boolean | null
        }
        Insert: {
          access_guide_link?: string | null
          assets_folder_link?: string | null
          assets_uploaded?: boolean | null
          blocker_note?: string | null
          booking_link?: string | null
          created_at?: string | null
          id?: string
          intake_link?: string | null
          intake_submitted?: boolean | null
          meta_access_granted?: boolean | null
          offer_confirmed?: boolean | null
          proof_folder_link?: string | null
          proof_uploaded?: boolean | null
          service_area_confirmed?: boolean | null
          updated_at?: string | null
          user_id: string
          whatsapp_saved?: boolean | null
        }
        Update: {
          access_guide_link?: string | null
          assets_folder_link?: string | null
          assets_uploaded?: boolean | null
          blocker_note?: string | null
          booking_link?: string | null
          created_at?: string | null
          id?: string
          intake_link?: string | null
          intake_submitted?: boolean | null
          meta_access_granted?: boolean | null
          offer_confirmed?: boolean | null
          proof_folder_link?: string | null
          proof_uploaded?: boolean | null
          service_area_confirmed?: boolean | null
          updated_at?: string | null
          user_id?: string
          whatsapp_saved?: boolean | null
        }
        Relationships: []
      }
      portal_nurture_system: {
        Row: {
          approval_gate_passed: boolean | null
          assets_folder_link: string | null
          best_selling_service: string | null
          blockers_note: string | null
          cadence_confirmed: boolean | null
          channel_instagram_dm: boolean | null
          channel_whatsapp: boolean | null
          constraints: string | null
          created_at: string | null
          crm_used: boolean | null
          faq_doc_link: string | null
          faq_responses_pack: string | null
          faqs_raw: string | null
          follow_up_cadence: string | null
          handoff_rules_to_booking: string | null
          id: string
          ideal_customer: string | null
          lead_gate_questions: string | null
          lead_gates_approved: boolean | null
          nurture_script_pack: string | null
          objections_raw: string | null
          response_windows: string | null
          scripts_approved: boolean | null
          scripts_doc_link: string | null
          starting_price: string | null
          tools_access_confirmed: boolean | null
          tools_access_notes: string | null
          tracking_confirmed: boolean | null
          tracking_link: string | null
          tracking_method: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_gate_passed?: boolean | null
          assets_folder_link?: string | null
          best_selling_service?: string | null
          blockers_note?: string | null
          cadence_confirmed?: boolean | null
          channel_instagram_dm?: boolean | null
          channel_whatsapp?: boolean | null
          constraints?: string | null
          created_at?: string | null
          crm_used?: boolean | null
          faq_doc_link?: string | null
          faq_responses_pack?: string | null
          faqs_raw?: string | null
          follow_up_cadence?: string | null
          handoff_rules_to_booking?: string | null
          id?: string
          ideal_customer?: string | null
          lead_gate_questions?: string | null
          lead_gates_approved?: boolean | null
          nurture_script_pack?: string | null
          objections_raw?: string | null
          response_windows?: string | null
          scripts_approved?: boolean | null
          scripts_doc_link?: string | null
          starting_price?: string | null
          tools_access_confirmed?: boolean | null
          tools_access_notes?: string | null
          tracking_confirmed?: boolean | null
          tracking_link?: string | null
          tracking_method?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_gate_passed?: boolean | null
          assets_folder_link?: string | null
          best_selling_service?: string | null
          blockers_note?: string | null
          cadence_confirmed?: boolean | null
          channel_instagram_dm?: boolean | null
          channel_whatsapp?: boolean | null
          constraints?: string | null
          created_at?: string | null
          crm_used?: boolean | null
          faq_doc_link?: string | null
          faq_responses_pack?: string | null
          faqs_raw?: string | null
          follow_up_cadence?: string | null
          handoff_rules_to_booking?: string | null
          id?: string
          ideal_customer?: string | null
          lead_gate_questions?: string | null
          lead_gates_approved?: boolean | null
          nurture_script_pack?: string | null
          objections_raw?: string | null
          response_windows?: string | null
          scripts_approved?: boolean | null
          scripts_doc_link?: string | null
          starting_price?: string | null
          tools_access_confirmed?: boolean | null
          tools_access_notes?: string | null
          tracking_confirmed?: boolean | null
          tracking_link?: string | null
          tracking_method?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          caption: string | null
          content_item_id: string | null
          created_at: string | null
          error: string | null
          id: string
          media_url: string | null
          notes: string | null
          platform: string | null
          platform_post_id: string | null
          post_type: string
          proof_card_id: string | null
          scheduled_for: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_ids?: string[] | null
          caption?: string | null
          content_item_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          media_url?: string | null
          notes?: string | null
          platform?: string | null
          platform_post_id?: string | null
          post_type: string
          proof_card_id?: string | null
          scheduled_for: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_ids?: string[] | null
          caption?: string | null
          content_item_id?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          media_url?: string | null
          notes?: string | null
          platform?: string | null
          platform_post_id?: string | null
          post_type?: string
          proof_card_id?: string | null
          scheduled_for?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
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
      script_library: {
        Row: {
          audio_duration_sec: number | null
          audio_path: string | null
          audio_updated_at: string | null
          body: string
          created_at: string
          hook: string | null
          id: string
          last_used_at: string | null
          platform: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          audio_duration_sec?: number | null
          audio_path?: string | null
          audio_updated_at?: string | null
          body: string
          created_at?: string
          hook?: string | null
          id?: string
          last_used_at?: string | null
          platform?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          audio_duration_sec?: number | null
          audio_path?: string | null
          audio_updated_at?: string | null
          body?: string
          created_at?: string
          hook?: string | null
          id?: string
          last_used_at?: string | null
          platform?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
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
      user_settings: {
        Row: {
          calendly_embed_type: string | null
          calendly_link: string | null
          created_at: string
          lead_webhook_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendly_embed_type?: string | null
          calendly_link?: string | null
          created_at?: string
          lead_webhook_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendly_embed_type?: string | null
          calendly_link?: string | null
          created_at?: string
          lead_webhook_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          audio_mime: string | null
          audio_path: string | null
          bucket: string
          bytes: number | null
          created_at: string
          description: string | null
          has_audio: boolean | null
          id: string
          mime: string | null
          path: string
          platform: string | null
          title: string
          user_id: string
        }
        Insert: {
          audio_mime?: string | null
          audio_path?: string | null
          bucket?: string
          bytes?: number | null
          created_at?: string
          description?: string | null
          has_audio?: boolean | null
          id?: string
          mime?: string | null
          path: string
          platform?: string | null
          title: string
          user_id: string
        }
        Update: {
          audio_mime?: string | null
          audio_path?: string | null
          bucket?: string
          bytes?: number | null
          created_at?: string
          description?: string | null
          has_audio?: boolean | null
          id?: string
          mime?: string | null
          path?: string
          platform?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
