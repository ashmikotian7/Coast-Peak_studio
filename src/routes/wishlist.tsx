import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useStore } from "@/hooks/use-store";
import { useCatalog } from "@/hooks/use-catalog";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — Coast & Peak Studio" },
      { name: "description", content: "Pieces you adore" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const {
    wishlist,
    wishlistProducts,
    isLoadingWishlist,
    removeFromWishlist,
    moveWishlistToCart,
  } = useStore();
  const { products: catalogProducts } = useCatalog();

  // Deduplicate and resolve full product objects
  const displayedItems: Product[] = (() => {
    const map = new Map<string, Product>();

    // 1. From API wishlist response
    for (const p of wishlistProducts) {
      map.set(String(p.id), p);
    }

    // 2. Fallback from catalog for any IDs in wishlist
    for (const id of wishlist) {
      if (!map.has(String(id))) {
        const found = catalogProducts.find((p) => String(p.id) === String(id));
        if (found) {
          map.set(String(id), found);
        }
      }
    }

    return Array.from(map.values());
  })();

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">
            Kept close
          </p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Your Wishlist</h1>
          {displayedItems.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground font-serif">
              {displayedItems.length} {displayedItems.length === 1 ? "piece" : "pieces"} saved
            </p>
          )}
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {isLoadingWishlist && displayedItems.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="font-serif text-lg text-muted-foreground animate-pulse">
                Fetching your saved treasures…
              </p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <Heart className="h-10 w-10 text-[var(--wine)]" />
              </div>
              <h2 className="mt-8 font-display text-3xl">No favorites yet.</h2>
              <p className="mt-3 max-w-sm font-serif text-muted-foreground">
                Tap the heart on any piece to keep it here, ready for later.
              </p>
              <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground"
              >
                Discover pieces <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-8">
              {displayedItems.map((p) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-[28px] border border-border bg-card shadow-soft transition-all duration-300 hover:shadow-luxe"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <Link to="/product/$id" params={{ id: p.id }} className="block h-full w-full">
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                      />
                    </Link>
                    <button
                      type="button"
                      aria-label="Remove from wishlist"
                      onClick={() => removeFromWishlist(p.id)}
                      className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-md transition-all hover:bg-destructive hover:text-destructive-foreground shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex-1">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-serif">
                        {p.category}
                      </p>
                      <Link to="/product/$id" params={{ id: p.id }}>
                        <h3 className="mt-1 font-display text-xl transition-colors hover:text-[var(--royal)]">
                          {p.name}
                        </h3>
                      </Link>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                      <span className="font-display text-xl text-gold-gradient">
                        ${p.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => moveWishlistToCart(p.id, 1)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wider text-primary-foreground transition-transform duration-200 hover:scale-105"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" /> Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
