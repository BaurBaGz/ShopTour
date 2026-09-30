import type { Database } from "@/types/database";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];

export type ProductWithRelations = Product & {
  stores: Pick<Store, "id" | "name" | "city" | "latitude" | "longitude"> | null;
  categories: Pick<Category, "id" | "name"> | null;
  /** Расстояние до магазина по прямой, км — когда покупатель указал, где он */
  distanceKm?: number | null;
};

export type ProductDetails = Product & {
  stores: Store | null;
  categories: Pick<Category, "id" | "name"> | null;
};
