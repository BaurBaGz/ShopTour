import { getStoreForOwner } from "@/lib/auth/session";
import { getStaffMember } from "@/lib/auth/staff";

/** Куда вести после входа: сотрудника — в админку, владельца магазина — в кабинет, покупателя — в аккаунт */
export async function accountHome(userId: string): Promise<string> {
  if (await getStaffMember()) return "/admin";
  if (await getStoreForOwner(userId)) return "/dashboard";
  return "/account";
}

/** Адрес внутри сайта из параметра next (чужие домены не пускаем) */
export function safeNext(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "";
}
