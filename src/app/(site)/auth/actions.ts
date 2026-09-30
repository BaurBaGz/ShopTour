"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { accountHome, safeNext } from "@/lib/auth/home";
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
    options: { data: name ? { name } : undefined },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return { error: "С этим email уже есть аккаунт. Войдите или восстановите пароль." };
    }
    if (error.code === "weak_password") return { error: "Слишком простой пароль — придумайте сложнее" };
    return { error: error.message };
  }

  if (!data.session) {
    return { success: "Проверьте почту — мы отправили ссылку для подтверждения. После этого войдите." };
  }

  revalidatePath("/", "layout");
  redirect(safeNext(formData.get("next")) || "/account");
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const storeName = String(formData.get("storeName") ?? "").trim();
  const city = String(formData.get("city") ?? "Алматы").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? phone).trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!email || !password || !storeName || !address) {
    return { error: "Заполните обязательные поля" };
  }

  if (password.length < 6) {
    return { error: "Пароль должен быть не короче 6 символов" };
  }

  const supabase = await createClient();

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const user = authData.user;
  if (!user) {
    return {
      success:
        "Проверьте почту — мы отправили ссылку для подтверждения. После этого войдите в аккаунт.",
    };
  }

  const { error: storeError } = await supabase.from("stores").insert({
    owner_id: user.id,
    name: storeName,
    description: description || null,
    address,
    city,
    phone: phone || null,
    whatsapp: whatsapp || null,
  });

  if (storeError) {
    return { error: `Магазин не создан: ${storeError.message}` };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
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
    redirectTo: `${await requestOrigin()}/auth/confirm`,
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
