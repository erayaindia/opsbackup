export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface InventoryDatabase {
  public: {
    Tables: {
      movement_types: {
        Row: {
          id: number
          code: string
          description: string | null
        }
        Insert: {
          id?: number
          code: string
          description?: string | null
        }
        Update: {
          id?: number
          code?: string
          description?: string | null
        }
      }
      statuses: {
        Row: {
          id: number
          domain: string
          code: string
          description: string | null
        }
        Insert: {
          id?: number
          domain: string
          code: string
          description?: string | null
        }
        Update: {
          id?: number
          domain?: string
          code?: string
          description?: string | null
        }
      }
      alert_types: {
        Row: {
          id: number
          code: string
          description: string | null
        }
        Insert: {
          id?: number
          code: string
          description?: string | null
        }
        Update: {
          id?: number
          code?: string
          description?: string | null
        }
      }
      priorities: {
        Row: {
          id: number
          code: string
          level: number | null
          description: string | null
        }
        Insert: {
          id?: number
          code: string
          level?: number | null
          description?: string | null
        }
        Update: {
          id?: number
          code?: string
          level?: number | null
          description?: string | null
        }
      }
      reason_codes: {
        Row: {
          id: number
          domain: string
          code: string
          description: string | null
        }
        Insert: {
          id?: number
          domain: string
          code: string
          description?: string | null
        }
        Update: {
          id?: number
          domain?: string
          code?: string
          description?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          parent_category_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          parent_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          parent_category_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category_id: string | null
          description: string | null
          image_url: string | null
          status_id: number | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          description?: string | null
          image_url?: string | null
          status_id?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          description?: string | null
          image_url?: string | null
          status_id?: number | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          barcode: string | null
          attributes: Json
          cost: number | null
          price: number | null
          weight: number | null
          dimensions: Json | null
          status_id: number | null
          min_stock_level: number
          reorder_point: number
          reorder_quantity: number
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          barcode?: string | null
          attributes?: Json
          cost?: number | null
          price?: number | null
          weight?: number | null
          dimensions?: Json | null
          status_id?: number | null
          min_stock_level?: number
          reorder_point?: number
          reorder_quantity?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string
          barcode?: string | null
          attributes?: Json
          cost?: number | null
          price?: number | null
          weight?: number | null
          dimensions?: Json | null
          status_id?: number | null
          min_stock_level?: number
          reorder_point?: number
          reorder_quantity?: number
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          code: string | null
          contact_person: string | null
          email: string | null
          phone: string | null
          address: Json | null
          payment_terms: string | null
          lead_time_days: number
          minimum_order_value: number | null
          rating: number | null
          status_id: number | null
          tax_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          payment_terms?: string | null
          lead_time_days?: number
          minimum_order_value?: number | null
          rating?: number | null
          status_id?: number | null
          tax_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: Json | null
          payment_terms?: string | null
          lead_time_days?: number
          minimum_order_value?: number | null
          rating?: number | null
          status_id?: number | null
          tax_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      warehouses: {
        Row: {
          id: string
          name: string
          code: string
          address: Json | null
          manager_id: string | null
          capacity: number | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: Json | null
          manager_id?: string | null
          capacity?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: Json | null
          manager_id?: string | null
          capacity?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          product_variant_id: string
          warehouse_id: string
          lot_id: string | null
          from_location_id: string | null
          to_location_id: string | null
          movement_type_id: number
          qty: number
          unit_cost: number | null
          reference_type: string | null
          reference_id: string | null
          reason_code_id: number | null
          user_id: string | null
          notes: string | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          product_variant_id: string
          warehouse_id: string
          lot_id?: string | null
          from_location_id?: string | null
          to_location_id?: string | null
          movement_type_id: number
          qty: number
          unit_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          reason_code_id?: number | null
          user_id?: string | null
          notes?: string | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          product_variant_id?: string
          warehouse_id?: string
          lot_id?: string | null
          from_location_id?: string | null
          to_location_id?: string | null
          movement_type_id?: number
          qty?: number
          unit_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          reason_code_id?: number | null
          user_id?: string | null
          notes?: string | null
          occurred_at?: string
          created_at?: string
        }
      }
      inventory_balances: {
        Row: {
          product_variant_id: string
          warehouse_id: string
          location_id: string | null
          location_id_norm: string
          on_hand_qty: number
          allocated_qty: number
          available_qty: number
          last_counted_date: string | null
          last_movement_date: string | null
          updated_at: string
        }
        Insert: {
          product_variant_id: string
          warehouse_id: string
          location_id?: string | null
          on_hand_qty?: number
          allocated_qty?: number
          last_counted_date?: string | null
          last_movement_date?: string | null
          updated_at?: string
        }
        Update: {
          product_variant_id?: string
          warehouse_id?: string
          location_id?: string | null
          on_hand_qty?: number
          allocated_qty?: number
          last_counted_date?: string | null
          last_movement_date?: string | null
          updated_at?: string
        }
      }
      inventory_alerts: {
        Row: {
          id: string
          product_variant_id: string
          warehouse_id: string
          alert_type_id: number
          priority_id: number
          current_stock: number | null
          threshold: number | null
          status_id: number | null
          message: string | null
          auto_reorder_suggested: boolean
          suggested_qty: number | null
          created_at: string
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolved_by: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: string
          product_variant_id: string
          warehouse_id: string
          alert_type_id: number
          priority_id: number
          current_stock?: number | null
          threshold?: number | null
          status_id?: number | null
          message?: string | null
          auto_reorder_suggested?: boolean
          suggested_qty?: number | null
          created_at?: string
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string
          warehouse_id?: string
          alert_type_id?: number
          priority_id?: number
          current_stock?: number | null
          threshold?: number | null
          status_id?: number | null
          message?: string | null
          auto_reorder_suggested?: boolean
          suggested_qty?: number | null
          created_at?: string
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolved_by?: string | null
          resolved_at?: string | null
        }
      }
      supplier_prices: {
        Row: {
          id: string
          supplier_id: string
          product_variant_id: string
          moq: number
          tier_qty: number
          unit_cost: number
          currency: string | null
          valid_from: string | null
          valid_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          product_variant_id: string
          moq?: number
          tier_qty?: number
          unit_cost: number
          currency?: string | null
          valid_from?: string | null
          valid_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          product_variant_id?: string
          moq?: number
          tier_qty?: number
          unit_cost?: number
          currency?: string | null
          valid_from?: string | null
          valid_to?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          warehouse_id: string
          code: string
          type: string | null
          parent_location_id: string | null
          capacity: number | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          warehouse_id: string
          code: string
          type?: string | null
          parent_location_id?: string | null
          capacity?: number | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          warehouse_id?: string
          code?: string
          type?: string | null
          parent_location_id?: string | null
          capacity?: number | null
          active?: boolean
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          product_variant_id: string
          warehouse_id: string
          location_id: string | null
          qty: number
          reference_type: string
          reference_id: string
          status_id: number | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          fulfilled_at: string | null
        }
        Insert: {
          id?: string
          product_variant_id: string
          warehouse_id: string
          location_id?: string | null
          qty: number
          reference_type: string
          reference_id: string
          status_id?: number | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          fulfilled_at?: string | null
        }
        Update: {
          id?: string
          product_variant_id?: string
          warehouse_id?: string
          location_id?: string | null
          qty?: number
          reference_type?: string
          reference_id?: string
          status_id?: number | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          fulfilled_at?: string | null
        }
      }
    }
  }
}