"use server";

import { revalidatePath } from "next/cache";
import { getStaffMember } from "@/lib/auth/staff";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string; success?: string };

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const staff = await getStaffMember();
  if (!staff) return { error: "Нет доступа" };

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Пароль должен быть не короче 8 символов" };
  if (password !== confirm) return { error: "Пароли не совпадают" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  if (staff.must_change_password) {
    const { error: flagError } = await supabase
      .from("staff")
      .update({ must_change_password: false })
      .eq("user_id", staff.user_id);
    if (flagError) return { error: flagError.message };
  }

  revalidatePath("/admin", "layout");
  return { success: "Пароль изменён" };
}
