import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreView, storeMetadata } from "@/components/store/store-view";
import { getStoreBySlug } from "@/lib/data/catalog";

// Короткий адрес витрины магазина: shoptour.kz/s/<slug>
type ShortStorePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ShortStorePageProps): Promise<Metadata> {
  const { slug } = await params;
  return storeMetadata(await getStoreBySlug(slug));
}

export default async function ShortStorePage({ params }: ShortStorePageProps) {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  return <StoreView store={store} />;
}
