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

/** Для страниц кабинета: без входа — на страницу входа, покупателя без магазина — в его аккаунт */
export async function requireOwnerPage(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
  store: Store;
}> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login?next=/dashboard");
  const store = await getStoreForOwner(user.id);
  if (!store) redirect("/account");
  return { user, store };
}

export async function requireStoreOwner(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
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
