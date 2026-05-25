import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Heart, ShoppingBag, Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { products as seedProducts } from "@/lib/products";
import { useCatalog } from "@/hooks/use-catalog";
import { useStore } from "@/hooks/use-store";
import { ProductCard } from "@/components/sk/ProductCard";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  loader: ({ params }) => {
    // Seed lookup only for SSR head metadata; runtime lookup uses catalog.
    const product = seedProducts.find((p) => p.id === params.id) ?? null;
    return { product, id: params.id };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: `${p?.name ?? "Product"} — Coast & Peak Studio` },
        { name: "description", content: p?.description ?? "Handcrafted artisan jewelry by Coast & Peak Studio." },
        { property: "og:title", content: `${p?.name ?? "Product"} — Coast & Peak Studio` },
        { property: "og:description", content: p?.description ?? "" },
        { property: "og:image", content: p?.image ?? "" },
      ],
    };
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="flex min-h-[60vh] items-center justify-center px-6 pt-32 text-center">
        <div>
          <h1 className="font-display text-4xl">Piece not found</h1>
          <Link to="/shop" className="story-link mt-4 inline-block font-serif">Back to shop</Link>
        </div>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useLoaderData();
  const { products } = useCatalog();
  const product = products.find((p) => p.id === id);
  const { addToCart, toggleWishlist, isWished } = useStore();
  const [variant, setVariant] = useState("Alloy · M");
  const [qty, setQty] = useState(1);
  if (!product) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-6 pt-32 text-center">
          <div>
            <h1 className="font-display text-4xl">Piece not found</h1>
            <Link to="/shop" className="story-link mt-4 inline-block font-serif">Back to shop</Link>
          </div>
        </div>
      </SiteLayout>
    );
  }
  const wished = isWished(product.id);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-28 md:pt-36">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <Link to="/shop" className="inline-flex items-center gap-1 font-serif text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back to shop
          </Link>
        </div>
      </section>

      <section className="bg-lavender-gradient pb-16 pt-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2 md:gap-16 md:px-12">
          <div className="group relative overflow-hidden rounded-[28px_120px_28px_120px] bg-card shadow-luxe">
            <img
              src={product.image}
              alt={product.name}
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full object-cover transition-transform duration-[1500ms] ease-luxe group-hover:scale-110"
            />
          </div>

          <div>
            {product.tag && (
              <span className="inline-block rounded-full bg-gold-gradient px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[oklch(0.2_0.06_305)] shadow-gold">
                {product.tag}
              </span>
            )}
            <h1 className="mt-3 font-display text-5xl md:text-6xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">128 reviews</span>
            </div>
            <p className="mt-6 font-display text-4xl text-gold-gradient">${product.price}</p>
            <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">{product.description}</p>

            <div className="mt-8">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">Finish · Size</p>
              <div className="flex flex-wrap gap-2">
                {["Gold · S", "Gold · M", "Gold · L", "Rose · M"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                      variant === v ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 text-lg">−</button>
                <span className="w-8 text-center font-serif">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-4 py-2 text-lg">+</button>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> {product.stock} in stock
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  addToCart(product, qty);
                  toast.success("Added to cart", { description: product.name });
                }}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium uppercase tracking-[0.2em] text-primary-foreground shadow-soft transition-transform duration-300 ease-luxe hover:scale-[1.02]"
              >
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </button>
              <button
                onClick={() => {
                  toggleWishlist(product.id);
                  toast(wished ? "Removed from wishlist" : "Added to wishlist");
                }}
                aria-label="Wishlist"
                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border border-border transition-all duration-300 ${
                  wished ? "border-[var(--wine)] text-[var(--wine)]" : "hover:border-foreground/40"
                }`}
              >
                <Heart className={`h-5 w-5 ${wished ? "fill-current" : ""}`} />
              </button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-8">
              <Perk icon={Truck} label="Free shipping" sub="Worldwide · 3-5d" />
              <Perk icon={ShieldCheck} label="Lifetime care" sub="Polish & repair" />
              <Perk icon={RotateCcw} label="30-day returns" sub="No questions" />
            </div>

            <div className="mt-10 rounded-2xl bg-card p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Delivery estimate</p>
              <p className="mt-2 font-serif text-lg">Crafted & shipped within 3 days · Arrives by your door in 5–7 days.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-20">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <h2 className="mb-10 font-display text-3xl md:text-4xl">You may also love</h2>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-8">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Perk({ icon: Icon, label, sub }: { icon: typeof Truck; label: string; sub: string }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Icon className="h-5 w-5 text-[var(--royal)]" />
      <p className="font-serif text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
