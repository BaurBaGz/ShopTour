import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoreView, storeMetadata } from "@/components/store/store-view";
import { getStoreById } from "@/lib/data/catalog";

type StorePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { id } = await params;
  return storeMetadata(await getStoreById(id));
}

export default async function StorePage({ params }: StorePageProps) {
  const { id } = await params;
  const store = await getStoreById(id);
  if (!store) notFound();
  return <StoreView store={store} />;
}
