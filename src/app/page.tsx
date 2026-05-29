import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroSearch } from "@/components/home/hero-search";
import { getProducts } from "@/lib/data/catalog";

export default async function HomePage() {
  const featured = await getProducts({ limit: 8 });

  return (
    <main>
      <HeroSearch />
      <FeaturedProducts products={featured} />
    </main>
  );
}
