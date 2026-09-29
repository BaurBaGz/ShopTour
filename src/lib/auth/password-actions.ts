"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string; success?: string };

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  // Любой вошедший пользователь: сотрудник админки или владелец магазина
  const user = await getSessionUser();
  if (!user) return { error: "Войдите в аккаунт" };
  const staff = await getStaffMember();

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Пароль должен быть не короче 8 символов" };
  if (password !== confirm) return { error: "Пароли не совпадают" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  if (staff?.must_change_password) {
    const { error: flagError } = await supabase
      .from("staff")
      .update({ must_change_password: false })
      .eq("user_id", staff.user_id);
    if (flagError) return { error: flagError.message };
  }

  revalidatePath("/", "layout");
  return { success: "Пароль изменён" };
}
