import type { PostgrestError } from "@supabase/supabase-js";

export function logSupabaseError(
  context: string,
  error: PostgrestError | null,
): void {
  if (!error) return;

  console.error(`[Supabase] ${context}`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

export function formatSupabaseError(error: PostgrestError | null): string {
  if (!error) return "";
  const parts = [
    error.message,
    error.code ? `код: ${error.code}` : null,
    error.details ? `детали: ${error.details}` : null,
    error.hint ? `подсказка: ${error.hint}` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
