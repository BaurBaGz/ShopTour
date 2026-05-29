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
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
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
          owner_id: string | null;
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
          owner_id?: string | null;
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
          owner_id?: string | null;
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
          category_id: string;
          sizes: string[];
          images: string[];
          in_stock: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          price: number;
          category_id: string;
          sizes?: string[];
          images?: string[];
          in_stock?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          category_id?: string;
          sizes?: string[];
          images?: string[];
          in_stock?: boolean;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
