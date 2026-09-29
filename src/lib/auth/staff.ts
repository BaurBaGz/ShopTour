import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Database, StaffRole } from "@/types/database";

export type StaffMember = Database["public"]["Tables"]["staff"]["Row"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  admin: "Администратор",
  moderator: "Модератор",
};

/** Текущий сотрудник или null. Кэш на один запрос: layout и страница спрашивают вместе. */
export const getStaffMember = cache(async (): Promise<StaffMember | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[staff] getStaffMember:", error.message);
    return null;
  }
  return data;
});

/**
 * Для страниц админки: без входа — на страницу входа, без роли — на страницу «нет доступа».
 * Права на данные дополнительно проверяет сама база (RLS).
 */
export async function requireStaff(options?: { admin?: boolean }): Promise<StaffMember> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/admin");

  const staff = await getStaffMember();
  if (!staff) redirect("/admin/no-access");
  if (options?.admin && staff.role !== "admin") redirect("/admin");
  return staff;
}

/** Для серверных действий: без redirect, чтобы вернуть понятную ошибку в форму */
export async function getStaffForAction(options?: { admin?: boolean }) {
  const staff = await getStaffMember();
  if (!staff) return { staff: null, error: "Нет доступа к админке" } as const;
  if (options?.admin && staff.role !== "admin") {
    return { staff: null, error: "Действие доступно только администратору" } as const;
  }
  return { staff, error: null } as const;
}
