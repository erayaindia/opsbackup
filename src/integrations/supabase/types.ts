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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      channel_members: {
        Row: {
          channel_id: string | null
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          supabase_user_id: string | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          supabase_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          supabase_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          height: number | null
          id: string
          message_id: string
          mime_type: string
          width: number | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          height?: number | null
          id?: string
          message_id: string
          mime_type: string
          width?: number | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          height?: number | null
          id?: string
          message_id?: string
          mime_type?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          channel_id: string
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          channel_id: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          parent_message_id: string | null
          reply_to: string | null
          supabase_user_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          parent_message_id?: string | null
          reply_to?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachments?: Json | null
          channel_id?: string | null
          content?: string | null
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          parent_message_id?: string | null
          reply_to?: string | null
          supabase_user_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_user_profile"
            columns: ["supabase_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      pinned_messages: {
        Row: {
          channel_id: string
          id: string
          message_id: string
          pinned_at: string
          pinned_by: string
        }
        Insert: {
          channel_id: string
          id?: string
          message_id: string
          pinned_at?: string
          pinned_by: string
        }
        Update: {
          channel_id?: string
          id?: string
          message_id?: string
          pinned_at?: string
          pinned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pinned_messages_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          name: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          name?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          name?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          message_id: string | null
          supabase_user_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          message_id?: string | null
          supabase_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          message_id?: string | null
          supabase_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_count: number | null
          brand: string | null
          consent_given: boolean | null
          contact_channel: string | null
          created_at: string | null
          description: string | null
          email: string | null
          full_name: string | null
          has_attachments: boolean | null
          id: string
          is_urgent: boolean | null
          issue_type: string | null
          order_id: string | null
          phone: string | null
          priority: string | null
          source: string | null
          status: string | null
          summary: string | null
          ticket_id: string | null
          timezone: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          attachment_count?: number | null
          brand?: string | null
          consent_given?: boolean | null
          contact_channel?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_urgent?: boolean | null
          issue_type?: string | null
          order_id?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          summary?: string | null
          ticket_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          attachment_count?: number | null
          brand?: string | null
          consent_given?: boolean | null
          contact_channel?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_urgent?: boolean | null
          issue_type?: string | null
          order_id?: string | null
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          summary?: string | null
          ticket_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          id: string
          title: string
          status: string
          platform: string
          thumbnail_url: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
          published_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          status?: string
          platform?: string
          thumbnail_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          status?: string
          platform?: string
          thumbnail_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      content_hooks: {
        Row: {
          id: string
          content_id: string
          hook_type: string
          text: string
          order_index: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          hook_type?: string
          text: string
          order_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          hook_type?: string
          text?: string
          order_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_hooks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_scripts: {
        Row: {
          id: string
          content_id: string
          section_type: string
          content: string
          plain_text: string | null
          order_index: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          section_type: string
          content: string
          plain_text?: string | null
          order_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          section_type?: string
          content?: string
          plain_text?: string | null
          order_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_scripts_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      shot_list: {
        Row: {
          id: string
          content_id: string
          shot_number: number
          shot_type: string | null
          description: string | null
          duration: number | null
          location: string | null
          equipment: Json | null
          notes: string | null
          status: string
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          shot_number: number
          shot_type?: string | null
          description?: string | null
          duration?: number | null
          location?: string | null
          equipment?: Json | null
          notes?: string | null
          status?: string
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          shot_number?: number
          shot_type?: string | null
          description?: string | null
          duration?: number | null
          location?: string | null
          equipment?: Json | null
          notes?: string | null
          status?: string
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shot_list_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_team_assignments: {
        Row: {
          id: string
          content_id: string
          user_id: string
          role: string
          assigned_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string
          role: string
          assigned_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          user_id?: string
          role?: string
          assigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_team_assignments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_body_sections: {
        Row: {
          id: string
          content_id: string
          section_title: string | null
          bullet_points: Json
          details: string | null
          order_index: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          section_title?: string | null
          bullet_points?: Json
          details?: string | null
          order_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          section_title?: string | null
          bullet_points?: Json
          details?: string | null
          order_index?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_body_sections_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_planning_data: {
        Row: {
          id: string
          content_id: string
          concept: string
          body: string
          cta: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          concept?: string
          body?: string
          cta?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          concept?: string
          body?: string
          cta?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_planning_data_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_comments: {
        Row: {
          id: string
          content_id: string
          user_id: string
          comment: string
          parent_comment_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string
          comment: string
          parent_comment_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          user_id?: string
          comment?: string
          parent_comment_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          }
        ]
      }
      content_versions: {
        Row: {
          id: string
          content_id: string
          version_number: number
          changes: Json
          changed_by: string | null
          change_description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          version_number: number
          changes: Json
          changed_by?: string | null
          change_description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          version_number?: number
          changes?: Json
          changed_by?: string | null
          change_description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_tags: {
        Row: {
          id: string
          content_id: string
          tag: string
          created_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          tag: string
          created_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          tag?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      content_attachments: {
        Row: {
          id: string
          content_id: string
          file_name: string
          file_path: string
          file_type: string | null
          file_size: number | null
          uploaded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          content_id: string
          file_name: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          content_id?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          uploaded_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_attachments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          image_url: string | null
          category_id: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          image_url?: string | null
          category_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          image_url?: string | null
          category_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          barcode: string | null
          cost: number | null
          price: number | null
          weight: number | null
          min_stock_level: number
          reorder_point: number
          reorder_quantity: number
          attributes: Json | null
          status_id: number | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          barcode?: string | null
          cost?: number | null
          price?: number | null
          weight?: number | null
          min_stock_level?: number
          reorder_point?: number
          reorder_quantity?: number
          attributes?: Json | null
          status_id?: number | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string
          barcode?: string | null
          cost?: number | null
          price?: number | null
          weight?: number | null
          min_stock_level?: number
          reorder_point?: number
          reorder_quantity?: number
          attributes?: Json | null
          status_id?: number | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      warehouses: {
        Row: {
          id: string
          name: string
          code: string
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          contact_person: string | null
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          postal_code: string | null
          tax_number: string | null
          payment_terms: string | null
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          tax_number?: string | null
          payment_terms?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          postal_code?: string | null
          tax_number?: string | null
          payment_terms?: string | null
          is_active?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_balances: {
        Row: {
          id: string
          product_variant_id: string
          warehouse_id: string
          location_id: string | null
          on_hand_qty: number
          allocated_qty: number
          available_qty: number
          last_counted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_variant_id: string
          warehouse_id: string
          location_id?: string | null
          on_hand_qty?: number
          allocated_qty?: number
          available_qty?: number
          last_counted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string
          warehouse_id?: string
          location_id?: string | null
          on_hand_qty?: number
          allocated_qty?: number
          available_qty?: number
          last_counted_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balances_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balances_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_movements: {
        Row: {
          id: string
          product_variant_id: string
          warehouse_id: string
          movement_type_id: number
          qty: number
          unit_cost: number | null
          reference_type: string | null
          reference_id: string | null
          from_location_id: string | null
          to_location_id: string | null
          user_id: string | null
          notes: string | null
          occurred_at: string
          created_at: string | null
        }
        Insert: {
          id?: string
          product_variant_id: string
          warehouse_id: string
          movement_type_id: number
          qty: number
          unit_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          from_location_id?: string | null
          to_location_id?: string | null
          user_id?: string | null
          notes?: string | null
          occurred_at?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string
          warehouse_id?: string
          movement_type_id?: number
          qty?: number
          unit_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          from_location_id?: string | null
          to_location_id?: string | null
          user_id?: string | null
          notes?: string | null
          occurred_at?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_movement_type_id_fkey"
            columns: ["movement_type_id"]
            isOneToOne: false
            referencedRelation: "movement_types"
            referencedColumns: ["id"]
          }
        ]
      }
      movement_types: {
        Row: {
          id: number
          code: string
          description: string | null
          direction: string
          created_at: string | null
        }
        Insert: {
          id?: number
          code: string
          description?: string | null
          direction: string
          created_at?: string | null
        }
        Update: {
          id?: number
          code?: string
          description?: string | null
          direction?: string
          created_at?: string | null
        }
        Relationships: []
      }
      inventory_alerts: {
        Row: {
          id: string
          product_variant_id: string
          warehouse_id: string
          alert_type_id: number
          priority_id: number
          status_id: number
          current_stock: number | null
          threshold: number | null
          message: string | null
          auto_reorder_suggested: boolean
          suggested_qty: number | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolved_by: string | null
          resolved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          product_variant_id: string
          warehouse_id: string
          alert_type_id: number
          priority_id: number
          status_id: number
          current_stock?: number | null
          threshold?: number | null
          message?: string | null
          auto_reorder_suggested?: boolean
          suggested_qty?: number | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string
          warehouse_id?: string
          alert_type_id?: number
          priority_id?: number
          status_id?: number
          current_stock?: number | null
          threshold?: number | null
          message?: string | null
          auto_reorder_suggested?: boolean
          suggested_qty?: number | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          }
        ]
      }
      supplier_prices: {
        Row: {
          id: string
          product_variant_id: string
          supplier_id: string
          cost: number
          currency: string
          effective_date: string
          expiry_date: string | null
          is_current: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_variant_id: string
          supplier_id: string
          cost: number
          currency?: string
          effective_date: string
          expiry_date?: string | null
          is_current?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string
          supplier_id?: string
          cost?: number
          currency?: string
          effective_date?: string
          expiry_date?: string | null
          is_current?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_prices_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      statuses: {
        Row: {
          id: number
          domain: string
          code: string
          description: string | null
          is_active: boolean
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          domain: string
          code: string
          description?: string | null
          is_active?: boolean
          sort_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          domain?: string
          code?: string
          description?: string | null
          is_active?: boolean
          sort_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      shopify_orders: {
        Row: {
          id: string
          order_id: string
          order_number: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          total_price: number | null
          currency: string | null
          fulfillment_status: string | null
          payment_status: string | null
          tags: string | null
          line_items: Json | null
          shipping_address: Json | null
          billing_address: Json | null
          created_at: string | null
          updated_at: string | null
          processed_at: string | null
          cancelled_at: string | null
          closed_at: string | null
        }
        Insert: {
          id?: string
          order_id: string
          order_number?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          total_price?: number | null
          currency?: string | null
          fulfillment_status?: string | null
          payment_status?: string | null
          tags?: string | null
          line_items?: Json | null
          shipping_address?: Json | null
          billing_address?: Json | null
          created_at?: string | null
          updated_at?: string | null
          processed_at?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          order_number?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          total_price?: number | null
          currency?: string | null
          fulfillment_status?: string | null
          payment_status?: string | null
          tags?: string | null
          line_items?: Json | null
          shipping_address?: Json | null
          billing_address?: Json | null
          created_at?: string | null
          updated_at?: string | null
          processed_at?: string | null
          cancelled_at?: string | null
          closed_at?: string | null
        }
        Relationships: []
      }
      bills: {
        Row: {
          id: string
          bill_number: string
          supplier_id: string | null
          amount: number
          tax_amount: number | null
          total_amount: number
          currency: string
          due_date: string | null
          status: string
          payment_terms: string | null
          notes: string | null
          created_by: string | null
          approved_by: string | null
          paid_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          bill_number: string
          supplier_id?: string | null
          amount: number
          tax_amount?: number | null
          total_amount: number
          currency?: string
          due_date?: string | null
          status?: string
          payment_terms?: string | null
          notes?: string | null
          created_by?: string | null
          approved_by?: string | null
          paid_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          bill_number?: string
          supplier_id?: string | null
          amount?: number
          tax_amount?: number | null
          total_amount?: number
          currency?: string
          due_date?: string | null
          status?: string
          payment_terms?: string | null
          notes?: string | null
          created_by?: string | null
          approved_by?: string | null
          paid_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          }
        ]
      }
      bill_items: {
        Row: {
          id: string
          bill_id: string
          description: string
          quantity: number
          unit_price: number
          total_price: number
          product_variant_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          bill_id: string
          description: string
          quantity: number
          unit_price: number
          total_price: number
          product_variant_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          bill_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          product_variant_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      app_users: {
        Row: {
          id: string
          supabase_user_id: string | null
          name: string
          email: string
          phone: string | null
          role: string
          department: string | null
          status: string
          hire_date: string | null
          reporting_to: string | null
          employee_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          supabase_user_id?: string | null
          name: string
          email: string
          phone?: string | null
          role: string
          department?: string | null
          status?: string
          hire_date?: string | null
          reporting_to?: string | null
          employee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          supabase_user_id?: string | null
          name?: string
          email?: string
          phone?: string | null
          role?: string
          department?: string | null
          status?: string
          hire_date?: string | null
          reporting_to?: string | null
          employee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees_details: {
        Row: {
          id: string
          app_user_id: string
          employee_id: string
          personal_email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          address: Json | null
          documents: Json | null
          onboarding_status: string
          onboarding_completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          app_user_id: string
          employee_id: string
          personal_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          address?: Json | null
          documents?: Json | null
          onboarding_status?: string
          onboarding_completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          app_user_id?: string
          employee_id?: string
          personal_email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          address?: Json | null
          documents?: Json | null
          onboarding_status?: string
          onboarding_completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_details_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback_complaints: {
        Row: {
          id: string
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          feedback_type: string
          subject: string
          message: string
          priority: string
          status: string
          order_id: string | null
          assigned_to: string | null
          created_at: string | null
          updated_at: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          feedback_type: string
          subject: string
          message: string
          priority?: string
          status?: string
          order_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          feedback_type?: string
          subject?: string
          message?: string
          priority?: string
          status?: string
          order_id?: string | null
          assigned_to?: string | null
          created_at?: string | null
          updated_at?: string | null
          resolved_at?: string | null
        }
        Relationships: []
      }
      feedback_responses: {
        Row: {
          id: string
          feedback_id: string
          response_text: string
          responded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          feedback_id: string
          response_text: string
          responded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          feedback_id?: string
          response_text?: string
          responded_by?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_responses_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_complaints"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_records: {
        Row: {
          id: string
          app_user_id: string
          auth_user_id: string
          employee_id: string | null
          check_in_time: string
          check_out_time: string | null
          selfie_url: string | null
          location_verified: boolean
          ip_address: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          status: 'present' | 'late' | 'absent' | 'checked_out'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          app_user_id: string
          auth_user_id: string
          employee_id?: string | null
          check_in_time: string
          check_out_time?: string | null
          selfie_url?: string | null
          location_verified?: boolean
          ip_address?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          status?: 'present' | 'late' | 'absent' | 'checked_out'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          app_user_id?: string
          auth_user_id?: string
          employee_id?: string | null
          check_in_time?: string
          check_out_time?: string | null
          selfie_url?: string | null
          location_verified?: boolean
          ip_address?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          status?: 'present' | 'late' | 'absent' | 'checked_out'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      app_users: {
        Row: {
          id: string
          auth_user_id: string
          full_name: string | null
          company_email: string | null
          personal_email: string | null
          phone: string | null
          department: string | null
          designation: string | null
          work_location: string | null
          employment_type: string | null
          status: string
          role: string
          joined_at: string | null
          exited_at: string | null
          payroll_enabled: boolean
          module_access: string[]
          permissions_json: string
          onboarding_json: string
          documents_json: string
          devices_json: string
          kpis_json: string
          assets_json: string
          notes: string | null
          employee_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          full_name?: string | null
          company_email?: string | null
          personal_email?: string | null
          phone?: string | null
          department?: string | null
          designation?: string | null
          work_location?: string | null
          employment_type?: string | null
          status?: string
          role?: string
          joined_at?: string | null
          exited_at?: string | null
          payroll_enabled?: boolean
          module_access?: string[]
          permissions_json?: string
          onboarding_json?: string
          documents_json?: string
          devices_json?: string
          kpis_json?: string
          assets_json?: string
          notes?: string | null
          employee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          full_name?: string | null
          company_email?: string | null
          personal_email?: string | null
          phone?: string | null
          department?: string | null
          designation?: string | null
          work_location?: string | null
          employment_type?: string | null
          status?: string
          role?: string
          joined_at?: string | null
          exited_at?: string | null
          payroll_enabled?: boolean
          module_access?: string[]
          permissions_json?: string
          onboarding_json?: string
          documents_json?: string
          devices_json?: string
          kpis_json?: string
          assets_json?: string
          notes?: string | null
          employee_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: true
            referencedRelation: "auth.users"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_settings: {
        Row: {
          id: string
          office_name: string
          office_ip_ranges: string[]
          office_latitude: number
          office_longitude: number
          allowed_radius_meters: number
          work_start_time: string
          work_end_time: string
          late_threshold_minutes: number
          require_selfie: boolean
          require_location: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          office_name: string
          office_ip_ranges: string[]
          office_latitude: number
          office_longitude: number
          allowed_radius_meters?: number
          work_start_time: string
          work_end_time: string
          late_threshold_minutes?: number
          require_selfie?: boolean
          require_location?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          office_name?: string
          office_ip_ranges?: string[]
          office_latitude?: number
          office_longitude?: number
          allowed_radius_meters?: number
          work_start_time?: string
          work_end_time?: string
          late_threshold_minutes?: number
          require_selfie?: boolean
          require_location?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_channel_member: {
        Args: { channel_uuid: string }
        Returns: boolean
      }
      is_channel_moderator: {
        Args: { channel_uuid: string }
        Returns: boolean
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
