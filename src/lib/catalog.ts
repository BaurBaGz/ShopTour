import { createClient } from "@/lib/supabase/server";

export async function getStoresWithCoords() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("id, name, address, latitude, longitude")
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  return data ?? [];
}