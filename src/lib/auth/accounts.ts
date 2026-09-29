import { randomInt } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Серверные операции с аккаунтами через сервисный ключ. Вызывать только после проверки роли.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Без похожих символов (0/O, 1/l/I) — пароль диктуют голосом или пишут в мессенджер
export function temporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const target = email.trim().toLowerCase();
  // Пользователей немного — листаем страницы, пока не найдём
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** Найти аккаунт по email или создать с временным паролем (он вернётся один раз) */
export async function findOrCreateUser(
  email: string,
): Promise<{ userId: string; temporaryPassword: string | null }> {
  const existing = await findUserIdByEmail(email);
  if (existing) return { userId: existing, temporaryPassword: null };

  const password = temporaryPassword();
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(error?.message ?? "Не удалось создать аккаунт");
  return { userId: data.user.id, temporaryPassword: password };
}

/** Email-ы пользователей по id — для списков в админке */
export async function getUserEmails(ids: string[]): Promise<Map<string, string>> {
  const wanted = new Set(ids.filter(Boolean));
  const result = new Map<string, string>();
  if (wanted.size === 0) return result;
  const admin = createAdminClient();
  for (let page = 1; page <= 20 && result.size < wanted.size; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    for (const u of data.users) if (wanted.has(u.id) && u.email) result.set(u.id, u.email);
    if (data.users.length < 200) break;
  }
  return result;
}
