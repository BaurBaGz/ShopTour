"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStaffForAction } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { createClient } from "@/lib/supabase/server";
import type { BannerTheme } from "@/types/database";

export type BannerState = { error?: string; success?: string };

const THEMES: BannerTheme[] = ["rose", "dark", "light"];

function revalidateBanners() {
  revalidatePath("/admin/banners", "layout");
  revalidatePath("/catalog");
}

function readBanner(formData: FormData) {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const theme = text("theme") as BannerTheme;
  const href = text("cta_href");
  return {
    title: text("title"),
    accent: text("accent") || null,
    body: text("body") || null,
    cta_label: text("cta_label") || null,
    cta_href: href || null,
    image_url: text("image_url").split("\n")[0] || null,
    theme: THEMES.includes(theme) ? theme : "rose",
    is_active: formData.get("is_active") === "on",
  };
}

function validate(banner: ReturnType<typeof readBanner>): string | null {
  if (!banner.title) return "Введите заголовок";
  if (banner.cta_label && !banner.cta_href) return "У кнопки нет ссылки";
  if (banner.cta_href && !/^(\/|https?:\/\/|#next$)/.test(banner.cta_href)) {
    return "Ссылка должна начинаться с «/» (страница сайта), с http(s):// или быть «#next»";
  }
  return null;
}

export async function saveBannerAction(id: string | null, _prev: BannerState, formData: FormData): Promise<BannerState> {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const banner = readBanner(formData);
  const invalid = validate(banner);
  if (invalid) return { error: invalid };
  const supabase = await createClient();

  if (id) {
    if (!isUuid(id)) return { error: "Неверный баннер" };
    // Тип (текст / «Как это работает») не меняется — шаги встроены в сайт
    const { error: updateError } = await supabase
      .from("banners")
      .update({ ...banner, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updateError) return { error: updateError.message };
    revalidateBanners();
    return { success: "Сохранено" };
  }

  const { data: last } = await supabase.from("banners").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error: insertError } = await supabase
    .from("banners")
    .insert({ ...banner, kind: "text", sort_order: (last?.sort_order ?? 0) + 10 })
    .select("id")
    .single();
  if (insertError || !data) return { error: insertError?.message ?? "Не удалось создать баннер" };
  revalidateBanners();
  redirect(`/admin/banners/${data.id}?created=1`);
}

export async function toggleBannerAction(id: string, isActive: boolean) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный баннер" };
  const supabase = await createClient();
  const { error: updateError } = await supabase.from("banners").update({ is_active: isActive }).eq("id", id);
  if (updateError) return { error: updateError.message };
  revalidateBanners();
  return { error: null };
}

export async function moveBannerAction(id: string, direction: -1 | 1) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const supabase = await createClient();
  const { data } = await supabase.from("banners").select("id, sort_order").order("sort_order").order("created_at");
  const list = [...(data ?? [])];
  const index = list.findIndex((b) => b.id === id);
  if (index === -1 || !list[index + direction]) return { error: null };
  [list[index], list[index + direction]] = [list[index + direction], list[index]];
  for (const [i, b] of list.entries()) {
    if (b.sort_order !== (i + 1) * 10) {
      const { error: updateError } = await supabase.from("banners").update({ sort_order: (i + 1) * 10 }).eq("id", b.id);
      if (updateError) return { error: updateError.message };
    }
  }
  revalidateBanners();
  return { error: null };
}

export async function deleteBannerAction(id: string) {
  const { staff, error } = await getStaffForAction({ admin: true });
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверный баннер" };
  const supabase = await createClient();
  const { data, error: deleteError } = await supabase.from("banners").delete().eq("id", id).select("id");
  if (deleteError) return { error: deleteError.message };
  if (!data?.length) return { error: "Не удалось удалить — нет прав" };
  revalidateBanners();
  redirect("/admin/banners?deleted=1");
}
