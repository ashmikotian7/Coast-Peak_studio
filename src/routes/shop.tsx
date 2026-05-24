import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { ProductCard } from "@/components/sk/ProductCard";
import { products, collections } from "@/lib/products";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Coast & Peak Studio" },
      { name: "description", content: "Browse handcrafted rings, necklaces, earrings and bracelets by Coast &amp; Peak Studio." },
      { property: "og:title", content: "Shop — Coast & Peak Studio" },
      { property: "og:description", content: "Browse handcrafted rings, necklaces, earrings and bracelets by Coast &amp; Peak Studio." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");

  const filtered = useMemo(() => {
    let list = cat === "all" ? products : products.filter((p) => p.category === cat);
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [cat, sort]);

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pb-12 pt-32 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">The collection</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl">Shop Coast &amp; Peak</h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-muted-foreground">
            Each piece is hand-finished in our studio. Quantities are kept small on purpose.
          </p>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-border glass md:top-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-12">
          <div className="flex gap-1 overflow-x-auto">
            <Chip active={cat === "all"} onClick={() => setCat("all")}>All</Chip>
            {collections.map((c) => (
              <Chip key={c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "featured" | "low" | "high")}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm outline-none"
            >
              <option value="featured">Featured</option>
              <option value="low">Price · Low to high</option>
              <option value="high">Price · High to low</option>
            </select>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm transition-all duration-300 ease-luxe ${
        active ? "bg-primary text-primary-foreground shadow-soft" : "text-foreground/70 hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
