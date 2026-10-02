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
          slug: string;
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
          slug?: string;
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
          slug?: string;
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
          discount_until: string | null;
          category_id: string;
          sizes: string[];
          images: string[];
          size_stock: Json;
          in_stock: boolean;
          is_hidden: boolean;
          audience: ProductAudience;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          name: string;
          description?: string | null;
          price: number;
          old_price?: number | null;
          discount_until?: string | null;
          category_id: string;
          sizes?: string[];
          images?: string[];
          size_stock?: Json;
          in_stock?: boolean;
          is_hidden?: boolean;
          audience?: ProductAudience;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          old_price?: number | null;
          discount_until?: string | null;
          category_id?: string;
          sizes?: string[];
          images?: string[];
          size_stock?: Json;
          in_stock?: boolean;
          is_hidden?: boolean;
          audience?: ProductAudience;
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
      banners: {
        Row: {
          id: string;
          kind: BannerKind;
          title: string;
          accent: string | null;
          body: string | null;
          cta_label: string | null;
          cta_href: string | null;
          image_url: string | null;
          theme: BannerTheme;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind?: BannerKind;
          title: string;
          accent?: string | null;
          body?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_url?: string | null;
          theme?: BannerTheme;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          kind?: BannerKind;
          title?: string;
          accent?: string | null;
          body?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_url?: string | null;
          theme?: BannerTheme;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: number;
          created_at: string;
          type: AnalyticsEventType;
          visitor_id: string;
          path: string | null;
          product_id: string | null;
          store_id: string | null;
          banner_id: string | null;
          query: string | null;
          results: number | null;
        };
        Insert: {
          id?: never;
          created_at?: string;
          type: AnalyticsEventType;
          visitor_id: string;
          path?: string | null;
          product_id?: string | null;
          store_id?: string | null;
          banner_id?: string | null;
          query?: string | null;
          results?: number | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      user_lists: {
        Row: { user_id: string; kind: UserListKind; ids: string[]; updated_at: string };
        Insert: { user_id: string; kind: UserListKind; ids?: string[]; updated_at?: string };
        Update: { user_id?: string; kind?: UserListKind; ids?: string[]; updated_at?: string };
        Relationships: [];
      };
      saved_tours: {
        Row: { id: string; user_id: string; name: string; store_ids: string[]; created_at: string; updated_at: string };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          store_ids: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          store_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          store_id: string;
          product_id: string | null;
          product_name: string;
          size: string | null;
          price: number;
          customer_name: string;
          customer_phone: string;
          visit: ReservationVisit;
          comment: string | null;
          user_id: string | null;
          status: ReservationStatus;
          telegram_message_id: number | null;
          created_at: string;
          answered_at: string | null;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id?: string | null;
          product_name: string;
          size?: string | null;
          price: number;
          customer_name: string;
          customer_phone: string;
          visit: ReservationVisit;
          comment?: string | null;
          user_id?: string | null;
          status?: ReservationStatus;
          telegram_message_id?: number | null;
          created_at?: string;
          answered_at?: string | null;
        };
        Update: {
          status?: ReservationStatus;
          telegram_message_id?: number | null;
          answered_at?: string | null;
        };
        Relationships: [];
      };
      store_notifications: {
        Row: {
          store_id: string;
          telegram_chat_id: number | null;
          telegram_name: string | null;
          linked_at: string | null;
          link_code: string | null;
          link_code_expires_at: string | null;
          daily_summary: boolean;
          last_summary_at: string | null;
        };
        Insert: {
          store_id: string;
          telegram_chat_id?: number | null;
          telegram_name?: string | null;
          linked_at?: string | null;
          link_code?: string | null;
          link_code_expires_at?: string | null;
          daily_summary?: boolean;
          last_summary_at?: string | null;
        };
        Update: {
          telegram_chat_id?: number | null;
          telegram_name?: string | null;
          linked_at?: string | null;
          link_code?: string | null;
          link_code_expires_at?: string | null;
          daily_summary?: boolean;
          last_summary_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_staff_role: { Args: Record<string, never>; Returns: StaffRole | null };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      analytics_daily: {
        Args: { p_from: string; p_store?: string | null };
        Returns: {
          day: string;
          visitors: number;
          page_views: number;
          product_views: number;
          store_views: number;
          favorites: number;
        }[];
      };
      analytics_visitors: { Args: { p_from: string; p_store?: string | null }; Returns: number };
      analytics_top_products: {
        Args: { p_from: string; p_store?: string | null; p_limit?: number };
        Returns: { product_id: string; views: number; visitors: number; favorites: number }[];
      };
      analytics_top_stores: {
        Args: { p_from: string; p_limit?: number };
        Returns: {
          store_id: string;
          store_views: number;
          product_views: number;
          favorites: number;
          visitors: number;
        }[];
      };
      analytics_searches: {
        Args: { p_from: string; p_limit?: number };
        Returns: { query: string; searches: number; visitors: number; zero: number }[];
      };
      search_stores: {
        Args: { q: string; max_results?: number };
        Returns: {
          id: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          logo_url: string | null;
          latitude: number | null;
          longitude: number | null;
        }[];
      };
      analytics_banners: {
        Args: { p_from: string };
        Returns: { banner_id: string; views: number; clicks: number }[];
      };
    };
    Enums: {
      staff_role: StaffRole;
      store_status: StoreStatus;
      banner_kind: BannerKind;
      banner_theme: BannerTheme;
      analytics_event_type: AnalyticsEventType;
      reservation_status: ReservationStatus;
      product_audience: ProductAudience;
    };
  };
}

export type StaffRole = "admin" | "moderator";
export type StoreStatus = "draft" | "published" | "hidden";
export type BannerKind = "text" | "steps";
export type BannerTheme = "rose" | "dark" | "light";
export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "store_view"
  | "favorite_add"
  | "search"
  | "banner_view"
  | "banner_click";
export type UserListKind = "favorites" | "tour" | "recent";
export type ReservationStatus = "new" | "confirmed" | "declined" | "completed" | "no_show";
export type ReservationVisit = "today" | "tomorrow";
export type ProductAudience = "women" | "men" | "unisex" | "girls" | "boys" | "kids";
