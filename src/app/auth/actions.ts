"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
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
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
