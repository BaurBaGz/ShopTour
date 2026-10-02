"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";
import { getT } from "@/lib/i18n/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

/** Покупатель удаляет свой аккаунт: избранное, маршруты и история стираются вместе с ним */
export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const t = await getT();
  const user = await getSessionUser();
  if (!user) return { error: t.password.errorLogin };

  // Слово-подтверждение — на языке сайта (его же показывает форма)
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== t.account.deleteWord) {
    return { error: t.account.deleteErrorWord(t.account.deleteWord) };
  }

  // Сотрудника убирает администратор, магазин без владельца остался бы на сайте без присмотра
  if (await getStaffMember()) {
    return { error: t.account.deleteErrorStaff };
  }
  if (await getStoreForOwner(user.id)) {
    return { error: t.account.deleteErrorStore };
  }

  // Сначала выходим на этом устройстве, затем удаляем (списки и маршруты удалятся вместе с пользователем)
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account] delete:", error.message);
    return { error: t.account.deleteErrorFailed };
  }

  revalidatePath("/", "layout");
  redirect("/account/deleted");
}
