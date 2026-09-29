/**
 * Типы таблиц Supabase.
 * После применения миграции можно перегенерировать:
 * npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          address: string;
          city: string;
          phone: string | null;
          whatsapp: string | null;
          instagram: string | null;
          logo_url: string | null;
          latitude: number | null;
          longitude: number | null;
          owner_id: string | null;
          status: StoreStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          address: string;
          city: string;
          phone?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          logo_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          owner_id?: string | null;
          status?: StoreStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          address?: string;
          city?: string;
          phone?: string | null;
          whatsapp?: string | null;
          instagram?: string | null;
          logo_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          owner_id?: string | null;
          status?: StoreStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          description: string | null;
          price: number;
          old_price: number | null;
          category_id: string;
          sizes: string[];
          images: string[];
          size_stock: Json;
          in_stock: boolean;
          is_hidden: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          price: number;
          old_price?: number | null;
          category_id: string;
          sizes?: string[];
          images?: string[];
          size_stock?: Json;
          in_stock?: boolean;
          is_hidden?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          old_price?: number | null;
          category_id?: string;
          sizes?: string[];
          images?: string[];
          size_stock?: Json;
          in_stock?: boolean;
          is_hidden?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey";
            columns: ["store_id"];
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          user_id: string;
          role: StaffRole;
          email: string;
          name: string | null;
          must_change_password: boolean;
          invited_by: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: StaffRole;
          email: string;
          name?: string | null;
          must_change_password?: boolean;
          invited_by?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: StaffRole;
          email?: string;
          name?: string | null;
          must_change_password?: boolean;
          invited_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_staff_role: { Args: Record<string, never>; Returns: StaffRole | null };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      staff_role: StaffRole;
      store_status: StoreStatus;
    };
  };
}

export type StaffRole = "admin" | "moderator";
export type StoreStatus = "draft" | "published" | "hidden";
