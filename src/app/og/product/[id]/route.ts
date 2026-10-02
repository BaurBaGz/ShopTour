import { isUuid } from "@/lib/catalog-filters";
import { ogImageResponse } from "@/lib/og-image";
import { createClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };

/** Картинка-превью товара для мессенджеров: его первое фото (видимость проверяет база) */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!isUuid(id)) return ogImageResponse(request, null);
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("images").eq("id", id).maybeSingle();
  return ogImageResponse(request, data?.images?.[0]);
}
