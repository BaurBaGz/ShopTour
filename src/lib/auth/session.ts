import { isAuthSessionMissingError } from "@supabase/supabase-js";
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

export async function getStoreForOwner(userId: string): Promise<Store | null> {
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
