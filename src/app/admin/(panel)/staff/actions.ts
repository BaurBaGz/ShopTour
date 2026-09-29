"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getStaffForAction } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/types/database";

export type AddStaffState = {
  error?: string;
  /** Показывается один раз: email + временный пароль, чтобы передать сотруднику */
  created?: { email: string; password: string };
  success?: string;
};

const ROLES: StaffRole[] = ["admin", "moderator"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Без похожих символов (0/O, 1/l/I) — пароль диктуют голосом или пишут в мессенджер
function temporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  // Пользователей немного — листаем страницы, пока не найдём
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function addStaffAction(_prev: AddStaffState, formData: FormData): Promise<AddStaffState> {
  const { staff: me, error: accessError } = await getStaffForAction({ admin: true });
  if (!me) return { error: accessError };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "") as StaffRole;
  if (!EMAIL_RE.test(email)) return { error: "Проверьте email" };
  if (!ROLES.includes(role)) return { error: "Выберите роль" };

  const supabase = await createClient();
  const { data: existingStaff } = await supabase.from("staff").select("user_id").eq("email", email).maybeSingle();
  if (existingStaff) return { error: "Этот email уже в сотрудниках" };

  try {
    let userId = await findUserIdByEmail(email);
    let password: string | null = null;

    if (!userId) {
      password = temporaryPassword();
      const { data, error } = await createAdminClient().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data.user) return { error: error?.message ?? "Не удалось создать аккаунт" };
      userId = data.user.id;
    }

    // Запись о роли — от имени администратора: база сама проверит, что он админ (RLS)
    const { error: insertError } = await supabase.from("staff").insert({
      user_id: userId,
      email,
      name,
      role,
      must_change_password: password !== null,
      invited_by: me.user_id,
    });
    if (insertError) return { error: insertError.message };

    revalidatePath("/admin/staff");
    return password
      ? { created: { email, password } }
      : { success: `${email} уже был зарегистрирован — доступ выдан, входит со своим паролем` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Ошибка при добавлении" };
  }
}

export async function changeStaffRoleAction(userId: string, role: StaffRole) {
  const { staff: me, error } = await getStaffForAction({ admin: true });
  if (!me) return { error };
  if (userId === me.user_id) return { error: "Свою роль изменить нельзя" };
  if (!ROLES.includes(role)) return { error: "Неизвестная роль" };

  const supabase = await createClient();
  const { error: updateError } = await supabase.from("staff").update({ role }).eq("user_id", userId);
  if (updateError) return { error: updateError.message };
  revalidatePath("/admin/staff");
  return { error: null };
}

export async function removeStaffAction(userId: string) {
  const { staff: me, error } = await getStaffForAction({ admin: true });
  if (!me) return { error };
  if (userId === me.user_id) return { error: "Нельзя отключить самого себя" };

  const supabase = await createClient();
  // Аккаунт остаётся (он может быть владельцем магазина) — убираем только доступ к админке
  const { error: deleteError } = await supabase.from("staff").delete().eq("user_id", userId);
  if (deleteError) return { error: deleteError.message };
  revalidatePath("/admin/staff");
  return { error: null };
}
