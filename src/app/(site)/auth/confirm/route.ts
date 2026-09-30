import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { accountHome } from "@/lib/auth/home";
import { createClient } from "@/lib/supabase/server";

const EMAIL_TYPES: EmailOtpType[] = ["signup", "email", "recovery"];

/**
 * Ссылки из писем: подтверждение email при регистрации и «Забыли пароль?».
 * Проверяет одноразовый код, входит в аккаунт и ведёт дальше.
 * token_hash — наши шаблоны писем (работают на любом устройстве);
 * code — стандартные шаблоны Supabase (только в том же браузере, где регистрировались).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();
  let userId: string | null = null;
  // next=reset — ссылку запросили через «Забыли пароль?» (стандартный шаблон присылает только code)
  const recovery = type === "recovery" || searchParams.get("next") === "reset";

  if (tokenHash && type && EMAIL_TYPES.includes(type)) {
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) console.error("[auth] verifyOtp:", error.message);
    userId = data.user?.id ?? null;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[auth] exchangeCode:", error.message);
    userId = data.user?.id ?? null;
  }

  if (!userId) {
    const expired = recovery ? "/auth/forgot?expired=1" : "/auth/login?confirm=expired";
    return NextResponse.redirect(new URL(expired, origin));
  }

  const next = recovery ? "/auth/reset" : `${await accountHome(userId)}?welcome=1`;
  return NextResponse.redirect(new URL(next, origin));
}
