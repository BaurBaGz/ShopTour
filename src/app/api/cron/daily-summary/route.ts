import { NextResponse, type NextRequest } from "next/server";
import { sendSummaries } from "@/lib/daily-summary";
import { telegramConfigured } from "@/lib/telegram";

// Утренняя сводка магазинам. Запускает Vercel Cron (vercel.json) с заголовком
// Authorization: Bearer <CRON_SECRET>. Для проверки: ?store=<id>&force=1&dry=1
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }
  if (!telegramConfigured()) return NextResponse.json({ error: "Telegram не настроен" }, { status: 503 });

  const params = request.nextUrl.searchParams;
  const result = await sendSummaries({
    storeId: params.get("store") ?? undefined,
    force: params.get("force") === "1",
    dryRun: params.get("dry") === "1",
  });
  return NextResponse.json(result);
}
