import { createClient } from "@/lib/supabase/server";
import {
  formatSupabaseError,
  logSupabaseError,
} from "@/lib/supabase/log-error";
import type { PostgrestError } from "@supabase/supabase-js";
import { PRODUCT_SELECT } from "@/lib/data/selects";
import { isSizeAvailable } from "@/lib/utils/product";
import type {
  Category,
  ProductDetails,
  ProductWithRelations,
  Store,
} from "@/lib/data/types";

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

export type ProductSort = "new" | "price_asc" | "price_desc";

export async function getProductsWithError(options?: {
  categoryId?: string;
  search?: string;
  storeId?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
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

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (options?.sort === "price_asc" || options?.sort === "price_desc") {
    query = query
      .order("price", { ascending: options.sort === "price_asc" })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (!options?.includeOutOfStock) {
    query = query.eq("in_stock", true);
  }

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  if (options?.storeId) {
    query = query.eq("store_id", options.storeId);
  }

  if (options?.size) {
    query = query.contains("sizes", [options.size]);
  }

  if (options?.minPrice !== undefined) {
    query = query.gte("price", options.minPrice);
  }

  if (options?.maxPrice !== undefined) {
    query = query.lte("price", options.maxPrice);
  }

  // Запятые, скобки и спецсимволы ломают синтаксис фильтра .or() в PostgREST
  const term = options?.search?.replace(/[,()%*\\]/g, " ").trim();
  if (term) {
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  logSupabaseError("getProducts", error);

  let products = (data as ProductWithRelations[]) ?? [];
  // Размер из фильтра должен быть не просто в списке, а ещё и не закончиться
  if (options?.size) {
    const size = options.size;
    products = products.filter((p) => isSizeAvailable(p, size));
  }

  return {
    data: products,
    error,
    errorMessage: formatSupabaseError(error),
  };
}

export async function getProducts(
  options?: Parameters<typeof getProductsWithError>[0],
): Promise<ProductWithRelations[]> {
  const { data } = await getProductsWithError(options);
  return data;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Товар с полными данными магазина — для страницы товара */
export async function getProductById(id: string): Promise<ProductDetails | null> {
  // Некорректный id Postgres отклонит ошибкой — сразу считаем, что товара нет
  if (!UUID_RE.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      stores!products_store_id_fkey ( * ),
      categories!products_category_id_fkey ( id, name )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  logSupabaseError("getProductById", error);

  return (data as ProductDetails | null) ?? null;
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
export type MapStore = Pick<
  Store,
  | "id"
  | "name"
  | "address"
  | "city"
  | "logo_url"
  | "phone"
  | "whatsapp"
  | "instagram"
  | "latitude"
  | "longitude"
>;

export async function getStoresWithCoords(): Promise<MapStore[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select(
      "id, name, address, city, logo_url, phone, whatsapp, instagram, latitude, longitude",
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  return data ?? [];
}

const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// Буквенные размеры по порядку, затем числовые по возрастанию, затем остальные
function compareSizes(a: string, b: string): number {
  const rank = (size: string): [number, number] => {
    const letter = LETTER_SIZES.indexOf(size);
    if (letter !== -1) return [0, letter];
    const num = Number(size);
    if (!Number.isNaN(num)) return [1, num];
    return [2, 0];
  };
  const [groupA, valueA] = rank(a);
  const [groupB, valueB] = rank(b);
  return groupA - groupB || valueA - valueB || a.localeCompare(b);
}

export type CatalogFilterOptions = {
  stores: { id: string; name: string }[];
  sizes: string[];
};

/** Магазины и размеры для панели фильтров каталога */
export async function getCatalogFilterOptions(): Promise<CatalogFilterOptions> {
  const supabase = await createClient();
  const [storesResult, sizesResult] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    supabase.from("products").select("sizes").eq("in_stock", true),
  ]);

  logSupabaseError("getCatalogFilterOptions (stores)", storesResult.error);
  logSupabaseError("getCatalogFilterOptions (sizes)", sizesResult.error);

  const sizes = new Set<string>();
  for (const row of sizesResult.data ?? []) {
    for (const size of row.sizes ?? []) sizes.add(size);
  }

  return {
    stores: storesResult.data ?? [],
    sizes: [...sizes].sort(compareSizes),
  };
}
