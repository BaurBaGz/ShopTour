"use server";

import { revalidatePath } from "next/cache";
import { EMAIL_RE, findOrCreateUser } from "@/lib/auth/accounts";
import { requireStoreOwner } from "@/lib/auth/session";
import { isUuid } from "@/lib/catalog-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AddSellerState = {
  error?: string;
  /** Показывается один раз: email + временный пароль, чтобы передать продавцу */
  created?: { email: string; password: string };
  success?: string;
};

const MAX_SELLERS = 5;

/** Владелец добавляет продавца: тот входит в кабинет, но не может удалять товары и менять профиль магазина */
export async function addSellerAction(_prev: AddSellerState, formData: FormData): Promise<AddSellerState> {
  let owner;
  try {
    owner = await requireStoreOwner();
  } catch {
    return { error: "Добавлять сотрудников может только владелец магазина" };
  }
  const { user, store } = owner;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || null;
  if (!EMAIL_RE.test(email)) return { error: "Проверьте email" };
  if (email === user.email?.toLowerCase()) return { error: "Это ваш собственный email — вы уже владелец" };

  const supabase = await createClient();
  const { count } = await supabase.from("store_members").select("user_id", { count: "exact", head: true }).eq("store_id", store.id);
  if ((count ?? 0) >= MAX_SELLERS) return { error: `В магазине может быть до ${MAX_SELLERS} продавцов` };

  try {
    const { userId, temporaryPassword: password } = await findOrCreateUser(email);

    // У владельца другого магазина свой кабинет — продавцом он быть не может
    const { data: ownStore } = await createAdminClient().from("stores").select("id").eq("owner_id", userId).maybeSingle();
    if (ownStore) return { error: "У этого человека есть свой магазин на ShopTour — добавить его продавцом нельзя" };

    // Запись — от имени владельца: база сама проверит, что магазин его (RLS)
    const { error: insertError } = await supabase.from("store_members").insert({
      store_id: store.id,
      user_id: userId,
      email,
      name,
      must_change_password: password !== null,
      invited_by: user.id,
    });
    if (insertError) {
      if (insertError.code === "23505") return { error: "Этот человек уже работает продавцом — у вас или в другом магазине" };
      return { error: insertError.message };
    }

    revalidatePath("/dashboard/staff");
    return password
      ? { created: { email, password } }
      : { success: `${email} уже был зарегистрирован — доступ выдан, входит со своим паролем` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ошибка при добавлении" };
  }
}

/** Убрать продавца: аккаунт остаётся (избранное, брони), пропадает только доступ в кабинет */
export async function removeSellerAction(userId: string): Promise<{ error: string | null }> {
  let owner;
  try {
    owner = await requireStoreOwner();
  } catch {
    return { error: "Убирать сотрудников может только владелец магазина" };
  }
  if (!isUuid(userId)) return { error: "Сотрудник не найден" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .delete()
    .eq("store_id", owner.store.id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Сотрудник не найден" };
  revalidatePath("/dashboard/staff");
  return { error: null };
}
