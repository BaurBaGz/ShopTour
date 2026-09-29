"use server";

import { revalidatePath } from "next/cache";
import { getStaffForAction } from "@/lib/auth/staff";
import { isUuid } from "@/lib/catalog-filters";
import { createClient } from "@/lib/supabase/server";

export type CategoryState = { error?: string; success?: string };

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
  revalidatePath("/stores");
}

function uniqueError(message: string) {
  return /duplicate|unique/i.test(message) ? "Такая категория уже есть" : message;
}

export async function addCategoryAction(_prev: CategoryState, formData: FormData): Promise<CategoryState> {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Введите название" };

  const supabase = await createClient();
  const { data: last } = await supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { error: insertError } = await supabase.from("categories").insert({ name, sort_order: (last?.sort_order ?? 0) + 10 });
  if (insertError) return { error: uniqueError(insertError.message) };
  revalidateCategories();
  return { success: `Категория «${name}» добавлена` };
}

export async function renameCategoryAction(id: string, name: string) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const trimmed = name.trim();
  if (!isUuid(id) || !trimmed) return { error: "Введите название" };
  const supabase = await createClient();
  const { error: updateError } = await supabase.from("categories").update({ name: trimmed }).eq("id", id);
  if (updateError) return { error: uniqueError(updateError.message) };
  revalidateCategories();
  return { error: null };
}

/** Поменять местами с соседом сверху/снизу */
export async function moveCategoryAction(id: string, direction: -1 | 1) {
  const { staff, error } = await getStaffForAction();
  if (!staff) return { error };
  const supabase = await createClient();
  const { data: all } = await supabase.from("categories").select("id, sort_order").order("sort_order").order("name");
  const list = all ?? [];
  const index = list.findIndex((c) => c.id === id);
  const neighbour = list[index + direction];
  if (index === -1 || !neighbour) return { error: null };

  // Порядок пересчитываем шагом 10, чтобы одинаковые sort_order не мешали обмену
  const reordered = [...list];
  [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
  for (const [i, c] of reordered.entries()) {
    if (c.sort_order !== (i + 1) * 10) {
      const { error: updateError } = await supabase.from("categories").update({ sort_order: (i + 1) * 10 }).eq("id", c.id);
      if (updateError) return { error: updateError.message };
    }
  }
  revalidateCategories();
  return { error: null };
}

export async function deleteCategoryAction(id: string) {
  const { staff, error } = await getStaffForAction({ admin: true });
  if (!staff) return { error };
  if (!isUuid(id)) return { error: "Неверная категория" };
  const supabase = await createClient();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return { error: `В категории ${count} товаров — сначала перенесите их в другую` };
  const { data, error: deleteError } = await supabase.from("categories").delete().eq("id", id).select("id");
  if (deleteError) return { error: deleteError.message };
  if (!data?.length) return { error: "Не удалось удалить — нет прав" };
  revalidateCategories();
  return { error: null };
}
