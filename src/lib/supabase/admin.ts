import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Клиент с сервисным ключом: обходит RLS и умеет создавать пользователей.
 * Только для сервера и только для действий, которые уже проверили роль администратора.
 * Ключ без NEXT_PUBLIC_, поэтому Next.js никогда не отправит его в браузер.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY не задан (.env.local и настройки Vercel)");
  }
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
