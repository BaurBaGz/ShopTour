"use client";

import { useEffect } from "react";
import { addRecent } from "@/lib/recent";

/** Запоминает открытый товар в «Недавно смотрели» */
export function RecordRecent({ productId }: { productId: string }) {
  useEffect(() => addRecent(productId), [productId]);
  return null;
}
