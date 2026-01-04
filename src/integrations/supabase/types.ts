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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ab_test_results: {
        Row: {
          conversion_value: number | null
          converted: boolean | null
          created_at: string | null
          id: string
          session_id: string | null
          test_id: string
          user_id: string | null
          variant: string
        }
        Insert: {
          conversion_value?: number | null
          converted?: boolean | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          test_id: string
          user_id?: string | null
          variant: string
        }
        Update: {
          conversion_value?: number | null
          converted?: boolean | null
          created_at?: string | null
          id?: string
          session_id?: string | null
          test_id?: string
          user_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ab_test_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          traffic_split: number | null
          variant_a: Json
          variant_b: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          traffic_split?: number | null
          variant_a: Json
          variant_b: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          traffic_split?: number | null
          variant_a?: Json
          variant_b?: Json
        }
        Relationships: []
      }
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
          reward_balance: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
          reward_balance?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
          reward_balance?: number | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      balance_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          payment_method: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          payment_method?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      birthday_coupons: {
        Row: {
          created_at: string | null
          id: string
          promo_code_id: string | null
          sent_at: string | null
          used_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          promo_code_id?: string | null
          sent_at?: string | null
          used_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          promo_code_id?: string | null
          sent_at?: string | null
          used_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "birthday_coupons_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "birthday_coupons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          admin_id: string
          created_at: string
          failed_count: number | null
          id: string
          message: string
          sent_at: string | null
          sent_count: number | null
          status: string
          target_audience: string
          title: string
          type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          failed_count?: number | null
          id?: string
          message: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          target_audience?: string
          title: string
          type: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          failed_count?: number | null
          id?: string
          message?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          target_audience?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string | null
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "product_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string | null
          id: string
          product_id: string
          product_name: string | null
          product_price: number | null
          quantity: number | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          product_id: string
          product_name?: string | null
          product_price?: number | null
          quantity?: number | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          product_id?: string
          product_name?: string | null
          product_price?: number | null
          quantity?: number | null
          user_id?: string
        }
        Relationships: []
      }
      cron_jobs: {
        Row: {
          created_at: string | null
          description: string | null
          function_name: string
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          last_status: string | null
          name: string
          schedule: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          function_name: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          last_status?: string | null
          name: string
          schedule: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          function_name?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          last_status?: string | null
          name?: string
          schedule?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          created_at: string
          id: string
          last_claim: string
          streak: number
          total_claimed: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_claim?: string
          streak?: number
          total_claimed?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_claim?: string
          streak?: number
          total_claimed?: number
          user_id?: string
        }
        Relationships: []
      }
      edge_function_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          function_name: string
          id: string
          ip_address: string | null
          operation: string
          request_data: Json | null
          response_data: Json | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name: string
          id?: string
          ip_address?: string | null
          operation: string
          request_data?: Json | null
          response_data?: Json | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name?: string
          id?: string
          ip_address?: string | null
          operation?: string
          request_data?: Json | null
          response_data?: Json | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string
          target_audience: string | null
          total_clicked: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          target_audience?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          target_audience?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_percent: number
          end_date: string
          id: string
          is_active: boolean | null
          max_uses: number | null
          product_ids: string[]
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_percent: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          product_ids?: string[]
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_percent?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          product_ids?: string[]
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      fortune_wheel_spins: {
        Row: {
          id: string
          prize_type: string
          prize_value: number
          spun_at: string
          user_id: string
        }
        Insert: {
          id?: string
          prize_type: string
          prize_value?: number
          spun_at?: string
          user_id: string
        }
        Update: {
          id?: string
          prize_type?: string
          prize_value?: number
          spun_at?: string
          user_id?: string
        }
        Relationships: []
      }
      homepage_banners: {
        Row: {
          background_gradient: string | null
          badge_color: string | null
          badge_text: string | null
          created_at: string | null
          display_order: number | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          start_date: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          background_gradient?: string | null
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          start_date?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          background_gradient?: string | null
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          display_order?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          start_date?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          admin_id: string | null
          change_amount: number
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string
          reason: string
        }
        Insert: {
          admin_id?: string | null
          change_amount: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id: string
          reason: string
        }
        Update: {
          admin_id?: string | null
          change_amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string
          reason?: string
        }
        Relationships: []
      }
      loyalty_levels: {
        Row: {
          cashback_percent: number
          color: string
          created_at: string | null
          discount_percent: number
          icon: string
          id: string
          min_spent: number
          name: string
        }
        Insert: {
          cashback_percent?: number
          color?: string
          created_at?: string | null
          discount_percent?: number
          icon?: string
          id?: string
          min_spent?: number
          name: string
        }
        Update: {
          cashback_percent?: number
          color?: string
          created_at?: string | null
          discount_percent?: number
          icon?: string
          id?: string
          min_spent?: number
          name?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          subject?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string | null
          id: string
          image: string | null
          is_pinned: boolean | null
          is_published: boolean | null
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string | null
          id?: string
          image?: string | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          image?: string | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          details: Json | null
          failed_count: number | null
          id: string
          recipients_count: number | null
          sent_count: number | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          failed_count?: number | null
          id?: string
          recipients_count?: number | null
          sent_count?: number | null
          type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          details?: Json | null
          failed_count?: number | null
          id?: string
          recipients_count?: number | null
          sent_count?: number | null
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          final_amount: number
          id: string
          payment_method: string
          payment_status: string | null
          steam_id: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          final_amount: number
          id?: string
          payment_method: string
          payment_status?: string | null
          steam_id?: string | null
          total_amount: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          final_amount?: number
          id?: string
          payment_method?: string
          payment_status?: string | null
          steam_id?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          notified_at: string | null
          product_id: string
          target_price: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notified_at?: string | null
          product_id: string
          target_price: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          notified_at?: string | null
          product_id?: string
          target_price?: number
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_price: number
          old_price: number
          product_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_price: number
          old_price: number
          product_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_price?: number
          old_price?: number
          product_id?: string
        }
        Relationships: []
      }
      product_bundles: {
        Row: {
          bundle_price: number
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image: string | null
          is_active: boolean | null
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          bundle_price: number
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          bundle_price?: number
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          action: string
          created_at: string | null
          id: string
          product_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          product_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
        }
        Relationships: []
      }
      product_inventory: {
        Row: {
          created_at: string | null
          id: string
          is_unlimited: boolean | null
          low_stock_threshold: number | null
          product_id: string
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_unlimited?: boolean | null
          low_stock_threshold?: number | null
          product_id: string
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_unlimited?: boolean | null
          low_stock_threshold?: number | null
          product_id?: string
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      product_views: {
        Row: {
          id: string
          product_id: string
          session_id: string | null
          source: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          session_id?: string | null
          source?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          name: string
          price: number
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id: string
          image?: string | null
          name: string
          price: number
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          banned_at: string | null
          banned_reason: string | null
          birthday: string | null
          created_at: string | null
          discord_id: string | null
          email_news_enabled: boolean | null
          email_order_updates_enabled: boolean | null
          email_promotions_enabled: boolean | null
          id: string
          is_banned: boolean | null
          is_veteran: boolean | null
          referral_code: string | null
          referred_by: string | null
          steam_id: string | null
          telegram_chat_id: number | null
          total_spent: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          banned_at?: string | null
          banned_reason?: string | null
          birthday?: string | null
          created_at?: string | null
          discord_id?: string | null
          email_news_enabled?: boolean | null
          email_order_updates_enabled?: boolean | null
          email_promotions_enabled?: boolean | null
          id: string
          is_banned?: boolean | null
          is_veteran?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          steam_id?: string | null
          telegram_chat_id?: number | null
          total_spent?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          banned_at?: string | null
          banned_reason?: string | null
          birthday?: string | null
          created_at?: string | null
          discord_id?: string | null
          email_news_enabled?: boolean | null
          email_order_updates_enabled?: boolean | null
          email_promotions_enabled?: boolean | null
          id?: string
          is_banned?: boolean | null
          is_veteran?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          steam_id?: string | null
          telegram_chat_id?: number | null
          total_spent?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promo_code_uses: {
        Row: {
          id: string
          order_id: string | null
          promo_code_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          promo_code_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          order_id?: string | null
          promo_code_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_uses_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          discount_percent: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          discount_percent: number
          end_date: string | null
          flash_title: string | null
          id: string
          is_active: boolean
          is_flash_sale: boolean | null
          product_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          discount_percent: number
          end_date?: string | null
          flash_title?: string | null
          id?: string
          is_active?: boolean
          is_flash_sale?: boolean | null
          product_id: string
          start_date?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number
          end_date?: string | null
          flash_title?: string | null
          id?: string
          is_active?: boolean
          is_flash_sale?: boolean | null
          product_id?: string
          start_date?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          request_count: number
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_given: boolean | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_given?: boolean | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_given?: boolean | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          closed_at: string | null
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_users: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean | null
          telegram_id: number
          telegram_username: string | null
          user_id: string | null
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          telegram_id: number
          telegram_username?: string | null
          user_id?: string | null
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean | null
          telegram_id?: number
          telegram_username?: string | null
          user_id?: string | null
          verification_code?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
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
      viewed_products: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_daily_bonus: {
        Args: { current_streak: number }
        Returns: number
      }
      can_spin_fortune_wheel: { Args: never; Returns: Json }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _ip_address: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      claim_daily_bonus: { Args: never; Returns: Json }
      deduct_balance: {
        Args: { amount: number; user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      safe_deduct_balance: {
        Args: { amount: number; user_id: string }
        Returns: boolean
      }
      spin_fortune_wheel: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "user" | "veteran" | "moderator" | "admin" | "super_admin"
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
      app_role: ["user", "veteran", "moderator", "admin", "super_admin"],
    },
  },
} as const
