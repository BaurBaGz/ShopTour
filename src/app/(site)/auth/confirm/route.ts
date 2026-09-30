import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ссылка из письма «Забыли пароль?». Проверяет одноразовый код, входит в аккаунт
 * и ведёт на страницу нового пароля.
 * token_hash — наш шаблон письма (работает на любом устройстве);
 * code — стандартный шаблон Supabase (только в том же браузере, где просили письмо).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) console.error("[auth] verifyOtp:", error.message);
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("[auth] exchangeCode:", error.message);
    ok = !error;
  }

  return NextResponse.redirect(new URL(ok ? "/auth/reset" : "/auth/forgot?expired=1", origin));
}
