import { createClient } from "@/lib/supabase/server";
import {
  formatSupabaseError,
  logSupabaseError,
} from "@/lib/supabase/log-error";
import type { PostgrestError } from "@supabase/supabase-js";
import type { Category, ProductWithRelations, Store } from "@/lib/data/types";

export type DataResult<T> = {
  data: T;
  error: PostgrestError | null;
  errorMessage: string | null;
};

const INVALID_ENV_MESSAGE =
  "Неверный NEXT_PUBLIC_SUPABASE_URL в .env.local (осталась заглушка your-project). Сохраните реальные ключи из Supabase → Settings → API и перезапустите npm run dev.";

function checkSupabaseEnv(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (
    !url ||
    url.includes("your-project") ||
    !url.includes("supabase.co") ||
    !key ||
    key === "your-anon-key"
  ) {
    return INVALID_ENV_MESSAGE;
  }

  return null;
}

const PRODUCT_SELECT = `
  *,
  stores!products_store_id_fkey ( id, name, city ),
  categories!products_category_id_fkey ( id, name )
`;

export async function getCategoriesWithError(): Promise<DataResult<Category[]>> {
  const envError = checkSupabaseEnv();
  if (envError) {
    console.error("[Supabase] getCategories (env)", envError);
    return { data: [], error: null, errorMessage: envError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  logSupabaseError("getCategories", error);

  return {
    data: data ?? [],
    error,
    errorMessage: formatSupabaseError(error),
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await getCategoriesWithError();
  return data;
}

export async function getProductsWithError(options?: {
  categoryId?: string;
  search?: string;
  storeId?: string;
  limit?: number;
  /** По умолчанию только in_stock; для страницы магазина и кабинета — true */
  includeOutOfStock?: boolean;
}): Promise<DataResult<ProductWithRelations[]>> {
  const envError = checkSupabaseEnv();
  if (envError) {
    console.error("[Supabase] getProducts (env)", envError);
    return { data: [], error: null, errorMessage: envError };
  }

  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });

  if (!options?.includeOutOfStock) {
    query = query.eq("in_stock", true);
  }

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.storeId) {
    query = query.eq("store_id", options.storeId);
  }

  if (options?.search?.trim()) {
    const term = options.search.trim();
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  logSupabaseError("getProducts", error);

  return {
    data: (data as ProductWithRelations[]) ?? [],
    error,
    errorMessage: formatSupabaseError(error),
  };
}

export async function getProducts(options?: {
  categoryId?: string;
  search?: string;
  storeId?: string;
  limit?: number;
  includeOutOfStock?: boolean;
}): Promise<ProductWithRelations[]> {
  const { data } = await getProductsWithError(options);
  return data;
}

export async function getStoreByIdWithError(
  id: string,
): Promise<DataResult<Store | null>> {
  const envError = checkSupabaseEnv();
  if (envError) {
    console.error("[Supabase] getStoreById (env)", envError);
    return { data: null, error: null, errorMessage: envError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  logSupabaseError("getStoreById", error);

  return {
    data: data ?? null,
    error,
    errorMessage: formatSupabaseError(error),
  };
}

export async function getStoreById(id: string): Promise<Store | null> {
  const { data } = await getStoreByIdWithError(id);
  return data;
}

export async function getStoreIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stores").select("id");

  logSupabaseError("getStoreIds", error);

  if (error || !data) return [];
  return data.map((row) => row.id);
}
