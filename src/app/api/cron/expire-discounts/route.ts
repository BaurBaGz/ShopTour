import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { almatyToday } from "@/lib/utils/product";

// Скидки со сроком: после последнего дня возвращаем обычную цену. Запускает Vercel Cron
// (vercel.json) вскоре после полуночи по Алматы, с заголовком Authorization: Bearer <CRON_SECRET>.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: expired, error } = await admin
    .from("products")
    .select("id, price, old_price")
    .lt("discount_until", almatyToday());
  if (error) {
    console.error("[expire-discounts] select:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let restored = 0;
  for (const product of expired ?? []) {
    const { error: updateError } = await admin
      .from("products")
      .update({
        // Срок без старой цены — просто убираем срок
        price: product.old_price !== null && product.old_price > product.price ? product.old_price : product.price,
        old_price: null,
        discount_until: null,
      })
      .eq("id", product.id);
    if (updateError) console.error("[expire-discounts] update:", updateError.message);
    else restored++;
  }

  if (restored > 0) {
    revalidatePath("/catalog");
    revalidatePath("/sale");
  }
  return NextResponse.json({ restored });
}
