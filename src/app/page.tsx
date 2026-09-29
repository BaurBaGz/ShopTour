import { FeaturedProducts } from "@/components/home/featured-products";
import { HeroSearch } from "@/components/home/hero-search";
import { HowItWorks } from "@/components/home/how-it-works";
import { getProducts } from "@/lib/data/catalog";

export default async function HomePage() {
  const products = await getProducts({ limit: 8 });

  return (
    <main>
      <HeroSearch />
      <HowItWorks />
      <FeaturedProducts products={products} />
    </main>
  );
}
