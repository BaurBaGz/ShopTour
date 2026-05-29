import type { Database } from "@/types/database";

export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];

export type ProductWithRelations = Product & {
  stores: Pick<Store, "id" | "name" | "city"> | null;
  categories: Pick<Category, "id" | "name"> | null;
};
