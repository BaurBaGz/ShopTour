import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
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

export type CabinetRole = "owner" | "seller";

export const CABINET_ROLE_LABELS: Record<CabinetRole, string> = { owner: "Владелец", seller: "Продавец" };

export type Cabinet = { store: Store; role: CabinetRole; mustChangePassword: boolean };

/** Магазин, в кабинет которого входит пользователь: свой (владелец) или тот, где он продавец */
export const getCabinet = cache(async (userId: string): Promise<Cabinet | null> => {
  const own = await getStoreForOwner(userId);
  if (own) return { store: own, role: "owner", mustChangePassword: false };

  const supabase = await createClient();
  const { data: member, error } = await supabase
    .from("store_members")
    .select("store_id, must_change_password")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error("[auth] getCabinet:", error.message);
  if (!member) return null;

  const { data: store } = await supabase.from("stores").select("*").eq("id", member.store_id).maybeSingle();
  return store ? { store, role: "seller", mustChangePassword: member.must_change_password } : null;
});

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

/**
 * Для страниц кабинета: без входа — на страницу входа, покупателя без магазина — в его аккаунт,
 * продавца со страницы «только для владельца» — на главную кабинета.
 */
export async function requireCabinetPage(options?: { ownerOnly?: boolean }): Promise<Cabinet & { user: SessionUser }> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");
  const cabinet = await getCabinet(user.id);
  if (!cabinet) redirect("/account");
  if (options?.ownerOnly && cabinet.role !== "owner") redirect("/dashboard");
  return { user, ...cabinet };
}

/** Для серверных действий, доступных и владельцу, и продавцу (права на данные проверяет ещё и база) */
export async function requireStoreMember(): Promise<{ user: SessionUser; store: Store; role: CabinetRole }> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  const cabinet = await getCabinet(user.id);
  if (!cabinet) throw new Error("NO_STORE");
  return { user, store: cabinet.store, role: cabinet.role };
}

/** Для серверных действий только владельца: профиль, сотрудники, удаление товаров */
export async function requireStoreOwner(): Promise<{
  user: SessionUser;
  store: Store;
}> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const store = await getStoreForOwner(user.id);
  if (!store) {
    throw new Error("NO_STORE");
  }

  return { user, store };
}
