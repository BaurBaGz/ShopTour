import { isUuid } from "@/lib/catalog-filters";
import { ogImageResponse } from "@/lib/og-image";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

/** Картинка-превью витрины: фото товара в наличии (свежее — первым), иначе логотип магазина */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return ogImageResponse(request, null);
  const supabase = await createClient();
  const [{ data: products }, { data: store }] = await Promise.all([
    supabase
      .from("products")
      .select("images")
      .eq("store_id", id)
      .eq("is_hidden", false)
      .eq("is_draft", false)
      .eq("in_stock", true)
      .order("created_at", { ascending: false })
      .limit(12),
    supabase.from("stores").select("logo_url").eq("id", id).maybeSingle(),
  ]);
  const photo = (products ?? []).map((p) => p.images?.[0]).find(Boolean);
  return ogImageResponse(request, photo ?? store?.logo_url);
}
