"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountHome, safeNext } from "@/lib/auth/home";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Введите email и пароль" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") return { error: "Неверный email или пароль" };
    if (error.code === "email_not_confirmed") {
      // Письмо могло потеряться — отправляем ещё раз (не чаще раза в минуту, это ограничивает Supabase)
      await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${await requestOrigin()}/auth/confirm` },
      });
      return {
        error: `Email ещё не подтверждён. Мы отправили письмо на ${email} — нажмите ссылку в нём. Проверьте и папку «Спам».`,
      };
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
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Введите email" };
  if (password.length < 8) return { error: "Пароль должен быть не короче 8 символов" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: name ? { name } : undefined,
      emailRedirectTo: `${await requestOrigin()}/auth/confirm`,
    },
  });

  const problem = signUpProblem(error, data.user);
  if (problem) return { error: problem };

  if (!data.session) {
    return { success: confirmEmailMessage(email) };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")) || "/account");
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
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
    return { error: "Заполните обязательные поля" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Введите email" };

  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов" };
  }

  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${await requestOrigin()}/auth/confirm` },
  });

  const problem = signUpProblem(signUpError, authData.user);
  if (problem) return { error: problem };
  const user = authData.user!;

  const store = {
    owner_id: user.id,
    name: storeName,
    description: description || null,
    address,
    city,
    phone: phone || null,
    whatsapp: whatsapp || null,
  };

  if (!authData.session) {
    // Нужно подтвердить email: входа ещё нет, поэтому магазин создаёт сервер — сразу черновиком.
    // Повторная отправка формы не создаёт второй магазин.
    const admin = createAdminClient();
    const { data: existing } = await admin.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
    if (!existing) {
      const { error: storeError } = await admin.from("stores").insert({ ...store, status: "draft" });
      if (storeError) return { error: `Магазин не создан: ${storeError.message}` };
    }
    return { success: confirmEmailMessage(email) };
  }

  const { error: storeError } = await supabase.from("stores").insert(store);

  if (storeError) {
    return { error: `Магазин не создан: ${storeError.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Понятная ошибка регистрации или null */
function signUpProblem(
  error: { code?: string; status?: number; message: string } | null,
  user: { identities?: unknown[] } | null,
): string | null {
  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return "С этим email уже есть аккаунт. Войдите или восстановите пароль.";
    }
    if (error.code === "weak_password") return "Слишком простой пароль — придумайте сложнее";
    if (error.status === 429 || /rate limit|seconds/i.test(error.message)) {
      return "Слишком много попыток. Подождите минуту и попробуйте снова.";
    }
    return error.message;
  }
  if (!user) return "Не удалось зарегистрироваться. Попробуйте ещё раз.";
  // При включённом подтверждении Supabase не сообщает, что email занят, — только пустым списком identities
  if (Array.isArray(user.identities) && user.identities.length === 0) {
    return "С этим email уже есть аккаунт. Войдите или восстановите пароль.";
  }
  return null;
}

function confirmEmailMessage(email: string) {
  return `Почти готово! Мы отправили письмо на ${email}. Нажмите ссылку в нём, чтобы подтвердить email, — после этого вы сразу войдёте. Проверьте и папку «Спам».`;
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
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Введите email, с которым входите в ShopTour" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await requestOrigin()}/auth/confirm?next=reset`,
  });

  if (error) {
    if (error.status === 429 || /seconds|rate limit/i.test(error.message)) {
      return { error: "Письмо уже отправлено недавно. Подождите минуту и попробуйте снова." };
    }
    console.error("[auth] resetPasswordForEmail:", error.message);
    return { error: "Не удалось отправить письмо. Попробуйте позже." };
  }

  // Одинаковый ответ для любых адресов — чтобы по форме нельзя было узнать, чей email зарегистрирован
  return {
    success: `Если аккаунт с адресом ${email} существует, мы отправили на него письмо со ссылкой для нового пароля. Проверьте и папку «Спам».`,
  };
}
