"use server";

import { storePhone } from "@/lib/utils/phone";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountHome, safeNext } from "@/lib/auth/home";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getLocale, getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { esc, notifyStaff } from "@/lib/telegram";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getT();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: t.auth.errorCredentialsRequired };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") return { error: t.auth.errorInvalidCredentials };
    if (error.code === "email_not_confirmed") {
      // Письмо могло потеряться — отправляем ещё раз (не чаще раза в минуту, это ограничивает Supabase)
      await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${await requestOrigin()}/auth/confirm` },
      });
      return { error: t.auth.errorNotConfirmed(email) };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");

  // Куда шёл человек (только адрес внутри сайта), иначе — по роли
  redirect(safeNext(formData.get("next")) || (await accountHome(data.user.id)));
}

/** Регистрация покупателя: избранное и маршруты на всех устройствах */
export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getT();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.auth.errorEmail };
  if (password.length < 8) return { error: t.auth.errorPasswordShort };

  const locale = await getLocale();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Язык сайта — чтобы письма приходили на нём же (шаблоны писем в Supabase)
      data: { ...(name ? { name } : {}), locale },
      emailRedirectTo: `${await requestOrigin()}/auth/confirm`,
    },
  });

  const problem = signUpProblem(error, data.user, t);
  if (problem) return { error: problem };

  if (!data.session) {
    return { success: t.auth.confirmSent(email) };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")) || "/account");
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getT();
  // Те же пределы длины, что и в настройках магазина в кабинете
  const text = (key: string, max: number, fallback = "") => String(formData.get(key) ?? fallback).trim().slice(0, max);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const storeName = text("storeName", 80);
  const city = text("city", 60, "Алматы");
  const address = text("address", 200);
  const phone = text("phone", 30);
  const whatsapp = text("whatsapp", 30, phone);
  const description = text("description", 1000);

  if (!email || !password || !storeName || !address) {
    return { error: t.auth.errorRequired };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: t.auth.errorEmail };

  if (password.length < 8) {
    return { error: t.auth.errorPasswordShort };
  }

  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await requestOrigin()}/auth/confirm`, data: { locale: await getLocale() } },
  });

  const problem = signUpProblem(signUpError, authData.user, t);
  if (problem) return { error: problem };
  const user = authData.user!;

  const store = {
    owner_id: user.id,
    name: storeName,
    description: description || null,
    address,
    city,
    phone: storePhone(phone),
    whatsapp: storePhone(whatsapp),
  };

  if (!authData.session) {
    // Нужно подтвердить email: входа ещё нет, поэтому магазин создаёт сервер — сразу черновиком.
    // Повторная отправка формы не создаёт второй магазин.
    const admin = createAdminClient();
    const { data: existing } = await admin.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
    if (!existing) {
      const { data: created, error: storeError } = await admin.from("stores").insert({ ...store, status: "draft" }).select("id").single();
      if (storeError) return { error: t.auth.errorStore(storeError.message) };
      await notifyNewStore(created.id, store, email);
    }
    return { success: t.auth.confirmSent(email) };
  }

  const { data: created, error: storeError } = await supabase.from("stores").insert(store).select("id").single();

  if (storeError) {
    return { error: t.auth.errorStore(storeError.message) };
  }
  await notifyNewStore(created.id, store, email);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Команде ShopTour — в Telegram: новый магазин ждёт проверки (по-русски, это для админки) */
async function notifyNewStore(id: string, store: { name: string; city: string; address: string; phone: string | null }, email: string) {
  try {
    await notifyStaff(
      [
        `🆕 <b>Новый магазин ждёт проверки</b>`,
        "",
        `${esc(store.name)} — ${esc(store.city)}, ${esc(store.address)}`,
        store.phone ? `Телефон: ${esc(store.phone)}` : null,
        `Email: ${esc(email)}`,
        "",
        `<a href="https://www.shoptour.kz/admin/partners/${id}">Открыть в админке</a>`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    );
  } catch (error) {
    console.error("[register] notify staff:", (error as Error).message);
  }
}

/** Понятная ошибка регистрации или null */
function signUpProblem(
  error: { code?: string; status?: number; message: string } | null,
  user: { identities?: unknown[] } | null,
  t: Dictionary,
): string | null {
  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return t.auth.errorExists;
    }
    if (error.code === "weak_password") return t.auth.errorWeakPassword;
    if (error.status === 429 || /rate limit|seconds/i.test(error.message)) {
      return t.auth.errorRateLimit;
    }
    return error.message;
  }
  if (!user) return t.auth.errorSignup;
  // При включённом подтверждении Supabase не сообщает, что email занят, — только пустым списком identities
  if (Array.isArray(user.identities) && user.identities.length === 0) {
    return t.auth.errorExists;
  }
  return null;
}

export async function logoutAction() {
  const supabase = await createClient();
  // Только это устройство: на телефоне аккаунт остаётся открытым
  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/");
}

/** Адрес сайта, с которого пришёл запрос (www.shoptour.kz, превью Vercel, localhost) */
async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : "https://www.shoptour.kz";
}

export async function forgotPasswordAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const t = await getT();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: t.auth.errorForgotEmail };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await requestOrigin()}/auth/confirm?next=reset`,
  });

  if (error) {
    if (error.status === 429 || /seconds|rate limit/i.test(error.message)) {
      return { error: t.auth.errorForgotRecent };
    }
    console.error("[auth] resetPasswordForEmail:", error.message);
    return { error: t.auth.errorForgotFailed };
  }

  // Одинаковый ответ для любых адресов — чтобы по форме нельзя было узнать, чей email зарегистрирован
  return { success: t.auth.forgotSent(email) };
}
