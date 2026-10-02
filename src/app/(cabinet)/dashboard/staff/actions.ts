"use server";

import { revalidatePath } from "next/cache";
import { EMAIL_RE, findOrCreateUser } from "@/lib/auth/accounts";
import { cleanPermissions, isMemberRole } from "@/lib/auth/permissions";
import { requireStorePermission } from "@/lib/auth/session";
import { isUuid } from "@/lib/catalog-filters";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AddMemberState = {
  error?: string;
  /** Показывается один раз: email + временный пароль, чтобы передать сотруднику */
  created?: { email: string; password: string };
  success?: string;
};

const MAX_MEMBERS = 10;
const NO_ACCESS = "Сотрудниками управляет владелец магазина или сотрудник с доступом «Сотрудники»";

async function staffManager() {
  try {
    return await requireStorePermission("staff");
  } catch {
    return null;
  }
}

/** Добавить сотрудника: роль задаёт шаблон доступов, галочки в форме — что открыто именно ему */
export async function addMemberAction(_prev: AddMemberState, formData: FormData): Promise<AddMemberState> {
  const manager = await staffManager();
  if (!manager) return { error: NO_ACCESS };
  const { user, store } = manager;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60) || null;
  const role = formData.get("role");
  const permissions = cleanPermissions(formData.getAll("permissions"));
  if (!EMAIL_RE.test(email)) return { error: "Проверьте email" };
  if (!isMemberRole(role)) return { error: "Выберите роль" };
  if (permissions.length === 0) return { error: "Отметьте хотя бы один доступ" };
  if (email === user.email?.toLowerCase()) return { error: "Это ваш собственный email — у вас уже есть доступ" };

  const supabase = await createClient();
  const { count } = await supabase.from("store_members").select("user_id", { count: "exact", head: true }).eq("store_id", store.id);
  if ((count ?? 0) >= MAX_MEMBERS) return { error: `В магазине может быть до ${MAX_MEMBERS} сотрудников` };

  try {
    const { userId, temporaryPassword: password } = await findOrCreateUser(email);

    // У владельца магазина свой кабинет — сотрудником он быть не может (в том числе владелец этого магазина)
    const { data: ownStore } = await createAdminClient().from("stores").select("id").eq("owner_id", userId).maybeSingle();
    if (ownStore) return { error: "У этого человека есть свой магазин на ShopTour — добавить его сотрудником нельзя" };

    // Запись — от имени того, кто добавляет: база сама проверит его доступ «Сотрудники» (RLS)
    const { error: insertError } = await supabase.from("store_members").insert({
      store_id: store.id,
      user_id: userId,
      email,
      name,
      role,
      permissions,
      must_change_password: password !== null,
      invited_by: user.id,
    });
    if (insertError) {
      if (insertError.code === "23505") return { error: "Этот человек уже работает сотрудником — у вас или в другом магазине" };
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

/** Поменять роль и доступы сотрудника (себе менять нельзя — это проверяет и база) */
export async function updateMemberAction(userId: string, role: string, permissions: string[]): Promise<{ error: string | null }> {
  const manager = await staffManager();
  if (!manager) return { error: NO_ACCESS };
  if (!isUuid(userId)) return { error: "Сотрудник не найден" };
  if (userId === manager.user.id) return { error: "Свои доступы изменить нельзя" };
  if (!isMemberRole(role)) return { error: "Выберите роль" };
  const clean = cleanPermissions(permissions);
  if (clean.length === 0) return { error: "Отметьте хотя бы один доступ — или отключите сотрудника" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .update({ role, permissions: clean })
    .eq("store_id", manager.store.id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Сотрудник не найден" };
  revalidatePath("/dashboard", "layout");
  return { error: null };
}

/** Убрать сотрудника: аккаунт остаётся (избранное, брони), пропадает только доступ в кабинет */
export async function removeMemberAction(userId: string): Promise<{ error: string | null }> {
  const manager = await staffManager();
  if (!manager) return { error: NO_ACCESS };
  if (!isUuid(userId)) return { error: "Сотрудник не найден" };
  if (userId === manager.user.id) return { error: "Нельзя отключить самого себя" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_members")
    .delete()
    .eq("store_id", manager.store.id)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "Сотрудник не найден" };
  revalidatePath("/dashboard/staff");
  return { error: null };
}
