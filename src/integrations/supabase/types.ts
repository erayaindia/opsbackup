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
