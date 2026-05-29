type SupabaseErrorBannerProps = {
  message: string;
  context?: string;
};

export function SupabaseErrorBanner({
  message,
  context,
}: SupabaseErrorBannerProps) {
  return (
    <div
      role="alert"
      className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-left sm:px-5"
    >
      <p className="text-sm font-semibold text-red-800">
        Ошибка загрузки из Supabase
        {context ? ` (${context})` : ""}
      </p>
      <p className="mt-2 font-mono text-xs leading-relaxed text-red-700">
        {message}
      </p>
      <p className="mt-3 text-xs text-red-600/90">
        Проверьте терминал с <code className="rounded bg-red-100 px-1">npm run dev</code>{" "}
        — там полный лог. Убедитесь, что в{" "}
        <code className="rounded bg-red-100 px-1">.env.local</code> реальные URL и anon key,
        затем перезапустите сервер.
      </p>
    </div>
  );
}
