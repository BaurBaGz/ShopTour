"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accountHome } from "@/lib/auth/home";
import { getSessionUser } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string; success?: string };

/** Сохраняет новый пароль из формы (поля password и confirm). null — успех, иначе текст ошибки. */
async function applyNewPassword(formData: FormData): Promise<string | null> {
  // Любой вошедший пользователь: сотрудник админки или владелец магазина
  const user = await getSessionUser();
  if (!user) return "Войдите в аккаунт";
  const staff = await getStaffMember();

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return "Пароль должен быть не короче 8 символов";
  if (password !== confirm) return "Пароли не совпадают";

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return "Новый пароль совпадает со старым — придумайте другой";
    return error.message;
  }

  if (staff?.must_change_password) {
    const { error: flagError } = await supabase
      .from("staff")
      .update({ must_change_password: false })
      .eq("user_id", staff.user_id);
    if (flagError) return flagError.message;
  }

  // Продавец магазина задал свой пароль вместо временного (свою запись он менять не может — пишет сервер)
  const { error: memberError } = await createAdminClient()
    .from("store_members")
    .update({ must_change_password: false })
    .eq("user_id", user.id)
    .eq("must_change_password", true);
  if (memberError) console.error("[password] store_members:", memberError.message);

  revalidatePath("/", "layout");
  return null;
}

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const error = await applyNewPassword(formData);
  return error ? { error } : { success: "Пароль изменён" };
}

/** Новый пароль по ссылке из письма «Забыли пароль?» — затем сразу в админку или кабинет */
export async function resetPasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const error = await applyNewPassword(formData);
  if (error) return { error };
  const user = await getSessionUser();
  redirect(user ? await accountHome(user.id) : "/auth/login");
}
