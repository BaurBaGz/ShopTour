"use server";

import { revalidatePath } from "next/cache";
import { deleteProduct, deleteStore } from "@/lib/data/admin";

export async function deleteProductAction(id: string) {
  const { error } = await deleteProduct(id);
  if (!error) {
    // Эта команда мгновенно обновит данные на странице админки
    revalidatePath("/admin");
  }
  return { error };
}

export async function deleteStoreAction(id: string) {
  const { error } = await deleteStore(id);
  if (!error) {
    revalidatePath("/admin");
  }
  return { error };
}