import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { cleanPermissions, isMemberRole, PERMISSIONS, type CabinetRole, type Permission } from "@/lib/auth/permissions";
import type { Store } from "@/lib/data/types";

/** Текущий пользователь; кэш на один запрос — шапка, страница и layout спрашивают вместе */
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Гость без входа — нормальная ситуация, а не ошибка
  if (error && !isAuthSessionMissingError(error)) {
    console.error("[auth] getUser:", error.message);
  }

  return error ? null : user;
});

// Кэш на один запрос: каркас кабинета и страница спрашивают магазин вместе
export const getStoreForOwner = cache(async (userId: string): Promise<Store | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[auth] getStoreForOwner:", error.message);
    return null;
  }

  return data;
});

export type Cabinet = { store: Store; role: CabinetRole; permissions: Permission[]; mustChangePassword: boolean };

/** Магазин, в кабинет которого входит пользователь: свой (владелец) или тот, где он сотрудник */
export const getCabinet = cache(async (userId: string): Promise<Cabinet | null> => {
  const own = await getStoreForOwner(userId);
  if (own) return { store: own, role: "owner", permissions: [...PERMISSIONS], mustChangePassword: false };

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("store_members")
    .select("store_id, role, permissions, must_change_password")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error("[auth] getCabinet:", error.message);
  if (!member) return null;

  const { data: store } = await supabase.from("stores").select("*").eq("id", member.store_id).maybeSingle();
  return store
    ? {
        store,
        role: isMemberRole(member.role) ? member.role : "seller",
        permissions: cleanPermissions(member.permissions ?? []),
        mustChangePassword: member.must_change_password,
      }
    : null;
});

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/**
 * Для страниц кабинета: без входа — на страницу входа, покупателя без магазина — в его аккаунт,
 * сотрудника без нужного доступа — на главную кабинета.
 */
export async function requireCabinetPage(options?: { permission?: Permission }): Promise<Cabinet & { user: SessionUser }> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");
  const cabinet = await getCabinet(user.id);
  if (!cabinet) redirect("/account");
  if (options?.permission && !cabinet.permissions.includes(options.permission)) redirect("/dashboard");
  return { user, ...cabinet };
}

/** Для серверных действий: нужен доступ к зоне кабинета (права на данные проверяет ещё и база) */
export async function requireStorePermission(permission: Permission): Promise<{ user: SessionUser; store: Store; role: CabinetRole }> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const cabinet = await getCabinet(user.id);
  if (!cabinet) throw new Error("NO_STORE");
  if (!cabinet.permissions.includes(permission)) throw new Error("FORBIDDEN");
  return { user, store: cabinet.store, role: cabinet.role };
}
