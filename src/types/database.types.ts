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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      add_on_orders: {
        Row: {
          add_on_type: string
          assigned_crew_id: string | null
          booking_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          price_at_purchase: number
          production_status: string
          updated_at: string
        }
        Insert: {
          add_on_type: string
          assigned_crew_id?: string | null
          booking_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          price_at_purchase: number
          production_status?: string
          updated_at?: string
        }
        Update: {
          add_on_type?: string
          assigned_crew_id?: string | null
          booking_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          price_at_purchase?: number
          production_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "add_on_orders_assigned_crew_id_fkey"
            columns: ["assigned_crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "add_on_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          id: string
          name: string | null
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      artists: {
        Row: {
          apple_music: string | null
          artist_name: string
          auth_user_id: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string
          id: string
          instagram: string | null
          name: string
          phone: string | null
          profile_image_url: string | null
          soundcloud: string | null
          spotify: string | null
          tiktok: string | null
          updated_at: string
          youtube: string | null
        }
        Insert: {
          apple_music?: string | null
          artist_name: string
          auth_user_id?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email: string
          id?: string
          instagram?: string | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          soundcloud?: string | null
          spotify?: string | null
          tiktok?: string | null
          updated_at?: string
          youtube?: string | null
        }
        Update: {
          apple_music?: string | null
          artist_name?: string
          auth_user_id?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          soundcloud?: string | null
          spotify?: string | null
          tiktok?: string | null
          updated_at?: string
          youtube?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          add_ons_total: number
          artist_id: string
          assigned_slot_time: string | null
          base_price: number
          batch_id: string | null
          created_at: string
          format: string
          id: string
          needs_scheduling: boolean
          payment_status: string
          pricing_snapshot: Json | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          terms_version: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          add_ons_total?: number
          artist_id: string
          assigned_slot_time?: string | null
          base_price?: number
          batch_id?: string | null
          created_at?: string
          format: string
          id?: string
          needs_scheduling?: boolean
          payment_status?: string
          pricing_snapshot?: Json | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          total_price?: number
          updated_at?: string
        }
        Update: {
          add_ons_total?: number
          artist_id?: string
          assigned_slot_time?: string | null
          base_price?: number
          batch_id?: string | null
          created_at?: string
          format?: string
          id?: string
          needs_scheduling?: boolean
          payment_status?: string
          pricing_snapshot?: Json | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          terms_version?: string | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "shoot_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          calendar_id: string
          connected_at: string
          connected_by: string
          refresh_token: string
          singleton: boolean
        }
        Insert: {
          calendar_id: string
          connected_at?: string
          connected_by: string
          refresh_token: string
          singleton?: boolean
        }
        Update: {
          calendar_id?: string
          connected_at?: string
          connected_by?: string
          refresh_token?: string
          singleton?: boolean
        }
        Relationships: []
      }
      content_items: {
        Row: {
          artist_id: string
          booking_id: string | null
          content_type: string
          created_at: string
          description: string | null
          featured: boolean
          format: string | null
          id: string
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          youtube_playlist_url: string | null
          youtube_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          artist_id: string
          booking_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          format?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          youtube_playlist_url?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          artist_id?: string
          booking_id?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          format?: string | null
          id?: string
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          youtube_playlist_url?: string | null
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          auth_user_id: string | null
          availability: Json
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          roles: string[]
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          availability?: Json
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          roles?: string[]
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          availability?: Json
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          roles?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      email_deliveries: {
        Row: {
          attempts: number
          booking_id: string | null
          content_id: string | null
          created_at: string
          email_type: string
          error: string | null
          id: string
          provider_id: string | null
          recipient: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          booking_id?: string | null
          content_id?: string | null
          created_at?: string
          email_type: string
          error?: string | null
          id?: string
          provider_id?: string | null
          recipient: string
          status: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          booking_id?: string | null
          content_id?: string | null
          created_at?: string
          email_type?: string
          error?: string | null
          id?: string
          provider_id?: string | null
          recipient?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_deliveries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_deliveries_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_responses: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          q1_what_minit_made_means: string | null
          q2_inspiration: string | null
          q3_collab_with: string | null
          q4_whats_next: string | null
          q5_why_minit_made: string | null
          q6_representing_city: string | null
          q7_sound_one_word: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          q1_what_minit_made_means?: string | null
          q2_inspiration?: string | null
          q3_collab_with?: string | null
          q4_whats_next?: string | null
          q5_why_minit_made?: string | null
          q6_representing_city?: string | null
          q7_sound_one_word?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          q1_what_minit_made_means?: string | null
          q2_inspiration?: string | null
          q3_collab_with?: string | null
          q4_whats_next?: string | null
          q5_why_minit_made?: string | null
          q6_representing_city?: string | null
          q7_sound_one_word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_responses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      music_submissions: {
        Row: {
          apple_music_url: string | null
          artist_name: string | null
          audio_file_url: string | null
          booking_id: string
          created_at: string
          explicit_content: boolean
          id: string
          instrumental_file_url: string | null
          lyrics: string | null
          performance_notes: string | null
          song_title: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          submission_status: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          apple_music_url?: string | null
          artist_name?: string | null
          audio_file_url?: string | null
          booking_id: string
          created_at?: string
          explicit_content?: boolean
          id?: string
          instrumental_file_url?: string | null
          lyrics?: string | null
          performance_notes?: string | null
          song_title?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          submission_status?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          apple_music_url?: string | null
          artist_name?: string | null
          audio_file_url?: string | null
          booking_id?: string
          created_at?: string
          explicit_content?: boolean
          id?: string
          instrumental_file_url?: string | null
          lyrics?: string | null
          performance_notes?: string | null
          song_title?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          submission_status?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "music_submissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      page_versions: {
        Row: {
          change_summary: string | null
          content: Json
          id: string
          page_id: string
          published_at: string
          published_by: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content: Json
          id?: string
          page_id: string
          published_at?: string
          published_by?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content?: Json
          id?: string
          page_id?: string
          published_at?: string
          published_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_versions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          meta_description: string | null
          og_image_url: string | null
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          meta_description?: string | null
          og_image_url?: string | null
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          meta_description?: string | null
          og_image_url?: string | null
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_config: {
        Row: {
          active: boolean
          audio_mix_master_base_price: number
          audio_mix_master_custom: boolean
          audio_mix_price: number
          broll_price: number
          bts_price: number
          created_at: string
          effective_date: string
          epk_basic_price: number
          epk_full_price: number
          format: string
          id: string
          interview_price: number
          notes: string | null
          phase: number
          photoshoot_price: number
          region: string
          updated_at: string
          video_production_price: number
        }
        Insert: {
          active?: boolean
          audio_mix_master_base_price?: number
          audio_mix_master_custom?: boolean
          audio_mix_price?: number
          broll_price?: number
          bts_price?: number
          created_at?: string
          effective_date?: string
          epk_basic_price?: number
          epk_full_price?: number
          format: string
          id?: string
          interview_price?: number
          notes?: string | null
          phase?: number
          photoshoot_price?: number
          region?: string
          updated_at?: string
          video_production_price: number
        }
        Update: {
          active?: boolean
          audio_mix_master_base_price?: number
          audio_mix_master_custom?: boolean
          audio_mix_price?: number
          broll_price?: number
          bts_price?: number
          created_at?: string
          effective_date?: string
          epk_basic_price?: number
          epk_full_price?: number
          format?: string
          id?: string
          interview_price?: number
          notes?: string | null
          phase?: number
          photoshoot_price?: number
          region?: string
          updated_at?: string
          video_production_price?: number
        }
        Relationships: []
      }
      pricing_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_changed: string
          id: string
          new_value: string | null
          previous_value: string | null
          pricing_config_id: string | null
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          pricing_config_id?: string | null
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
          pricing_config_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_history_pricing_config_id_fkey"
            columns: ["pricing_config_id"]
            isOneToOne: false
            referencedRelation: "pricing_config"
            referencedColumns: ["id"]
          },
        ]
      }
      production_prep: {
        Row: {
          booking_id: string
          broll_preference: string | null
          created_at: string
          height: string | null
          id: string
          performance_vibe: string | null
          production_notes: string | null
          special_requests: string | null
        }
        Insert: {
          booking_id: string
          broll_preference?: string | null
          created_at?: string
          height?: string | null
          id?: string
          performance_vibe?: string | null
          production_notes?: string | null
          special_requests?: string | null
        }
        Update: {
          booking_id?: string
          broll_preference?: string | null
          created_at?: string
          height?: string | null
          id?: string
          performance_vibe?: string | null
          production_notes?: string | null
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_prep_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      production_slots: {
        Row: {
          batch_id: string
          booking_id: string | null
          created_at: string
          id: string
          slot_time: string
          status: string
        }
        Insert: {
          batch_id: string
          booking_id?: string | null
          created_at?: string
          id?: string
          slot_time: string
          status?: string
        }
        Update: {
          batch_id?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          slot_time?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_slots_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "shoot_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_slots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      shoot_batch_crew: {
        Row: {
          batch_id: string
          created_at: string
          crew_id: string
          id: string
          role: string | null
        }
        Insert: {
          batch_id: string
          created_at?: string
          crew_id: string
          id?: string
          role?: string | null
        }
        Update: {
          batch_id?: string
          created_at?: string
          crew_id?: string
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shoot_batch_crew_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "shoot_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shoot_batch_crew_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crew_members"
            referencedColumns: ["id"]
          },
        ]
      }
      shoot_batches: {
        Row: {
          call_sheet_sent: boolean
          completed_at: string | null
          created_at: string
          current_artists: number
          format: string
          google_calendar_event_id: string | null
          google_calendar_sync_error: string | null
          id: string
          location: string
          max_artists: number
          month: string | null
          shoot_date: string
          status: string
          week_number: number | null
        }
        Insert: {
          call_sheet_sent?: boolean
          completed_at?: string | null
          created_at?: string
          current_artists?: number
          format: string
          google_calendar_event_id?: string | null
          google_calendar_sync_error?: string | null
          id?: string
          location: string
          max_artists?: number
          month?: string | null
          shoot_date: string
          status?: string
          week_number?: number | null
        }
        Update: {
          call_sheet_sent?: boolean
          completed_at?: string | null
          created_at?: string
          current_artists?: number
          format?: string
          google_calendar_event_id?: string | null
          google_calendar_sync_error?: string | null
          id?: string
          location?: string
          max_artists?: number
          month?: string | null
          shoot_date?: string
          status?: string
          week_number?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          booking_id: string | null
          event_id: string
          event_type: string
          outcome: string | null
          received_at: string
        }
        Insert: {
          booking_id?: string | null
          event_id: string
          event_type: string
          outcome?: string | null
          received_at?: string
        }
        Update: {
          booking_id?: string | null
          event_id?: string
          event_type?: string
          outcome?: string | null
          received_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_batch_slot: { Args: { p_batch_id: string }; Returns: string }
      confirm_booking_payment: {
        Args: {
          p_booking_id: string
          p_checkout_session_id: string
          p_payment_intent_id: string
          p_stripe_event_id: string
        }
        Returns: Json
      }
      current_artist_id: { Args: never; Returns: string }
      current_crew_id: { Args: never; Returns: string }
      expire_booking_payment: {
        Args: { p_booking_id: string; p_stripe_event_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      reassign_booking_batch: {
        Args: {
          p_batch_id: string
          p_booking_id: string
          p_slot_time: string
          p_status?: string
        }
        Returns: Json
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
