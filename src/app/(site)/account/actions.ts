"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser, getStoreForOwner } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

// Файл "use server" может экспортировать только функции
const DELETE_CONFIRM_WORD = "УДАЛИТЬ";

/** Покупатель удаляет свой аккаунт: избранное, маршруты и история стираются вместе с ним */
export async function deleteAccountAction(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const user = await getSessionUser();
  if (!user) return { error: "Войдите в аккаунт" };

  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== DELETE_CONFIRM_WORD) {
    return { error: `Введите слово ${DELETE_CONFIRM_WORD}, чтобы подтвердить` };
  }

  // Сотрудника убирает администратор, магазин без владельца остался бы на сайте без присмотра
  if (await getStaffMember()) {
    return { error: "Это аккаунт сотрудника ShopTour — его удаляет главный администратор в разделе «Сотрудники»." };
  }
  if (await getStoreForOwner(user.id)) {
    return {
      error: "К аккаунту привязан магазин. Чтобы удалить аккаунт, свяжитесь с командой ShopTour — сначала решим, что делать с магазином.",
    };
  }

  // Сначала выходим на этом устройстве, затем удаляем (списки и маршруты удалятся вместе с пользователем)
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account] delete:", error.message);
    return { error: "Не удалось удалить аккаунт. Попробуйте позже." };
  }

  revalidatePath("/", "layout");
  redirect("/account/deleted");
}
