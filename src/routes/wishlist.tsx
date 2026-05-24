import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { ProductCard } from "@/components/sk/ProductCard";
import { useStore } from "@/hooks/use-store";
import { products } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Coast & Peak Studio" }, { name: "description", content: "Pieces you adore" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useStore();
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">Kept close</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Your Wishlist</h1>
        </div>
      </section>
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <Heart className="h-10 w-10 text-[var(--wine)]" />
              </div>
              <h2 className="mt-8 font-display text-3xl">No favorites yet.</h2>
              <p className="mt-3 max-w-sm font-serif text-muted-foreground">
                Tap the heart on any piece to keep it here, ready for later.
              </p>
              <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground">
                Discover pieces <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
              {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
