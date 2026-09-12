import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { ProductCard } from "@/components/sk/ProductCard";
import { collections } from "@/lib/products";
import { useCatalog } from "@/hooks/use-catalog";
import { SlidersHorizontal, Sparkles, Flame, Gem, X } from "lucide-react";

interface ShopSearch {
  tag?: string;
  category?: string;
}

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => {
    return {
      tag: typeof search.tag === "string" ? search.tag : undefined,
      category: typeof search.category === "string" ? search.category : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Shop — Coast & Peak Studio" },
      { name: "description", content: "Browse handcrafted rings, necklaces, earrings and bracelets by Coast & Peak Studio." },
      { property: "og:title", content: "Shop — Coast & Peak Studio" },
      { property: "og:description", content: "Browse handcrafted rings, necklaces, earrings and bracelets by Coast & Peak Studio." },
    ],
  }),
  component: ShopPage,
});

const TAG_OPTIONS = [
  { id: "all", label: "All Pieces", icon: null },
  { id: "new", label: "New Arrivals", icon: Sparkles },
  { id: "bestseller", label: "Bestsellers", icon: Flame },
  { id: "limited", label: "Limited Edition", icon: Gem },
] as const;

function normalizeTag(tag?: string): string {
  if (!tag) return "all";
  const lower = tag.toLowerCase().trim();
  if (lower === "bestsellers" || lower === "bestseller" || lower === "best-sellers") return "bestseller";
  if (lower === "new" || lower === "new-arrivals") return "new";
  if (lower === "limited" || lower === "limited-edition") return "limited";
  return lower;
}

function ShopPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { products, isLoading } = useCatalog();

  const [activeTag, setActiveTag] = useState<string>(normalizeTag(searchParams.tag));
  const [cat, setCat] = useState<string>(searchParams.category || "all");
  const [sort, setSort] = useState<"featured" | "low" | "high">("featured");

  // Keep in sync with URL search params (e.g. clicking footer links)
  useEffect(() => {
    setActiveTag(normalizeTag(searchParams.tag));
    if (searchParams.category) {
      setCat(searchParams.category);
    }
  }, [searchParams.tag, searchParams.category]);

  const handleTagChange = (newTag: string) => {
    setActiveTag(newTag);
    navigate({
      to: "/shop",
      search: {
        tag: newTag !== "all" ? newTag : undefined,
        category: cat !== "all" ? cat : undefined,
      },
      replace: true,
    });
  };

  const handleCategoryChange = (newCat: string) => {
    setCat(newCat);
    navigate({
      to: "/shop",
      search: {
        tag: activeTag !== "all" ? activeTag : undefined,
        category: newCat !== "all" ? newCat : undefined,
      },
      replace: true,
    });
  };

  const clearFilters = () => {
    setActiveTag("all");
    setCat("all");
    navigate({
      to: "/shop",
      search: {},
      replace: true,
    });
  };

  const filtered = useMemo(() => {
    let list = [...products];

    // Filter by tag
    if (activeTag !== "all") {
      list = list.filter((p) => {
        if (!p.tag) return false;
        const pTag = p.tag.toLowerCase().trim();
        if (activeTag === "bestseller") {
          return pTag === "bestseller" || pTag === "bestsellers";
        }
        return pTag === activeTag;
      });
    }

    // Filter by category
    if (cat !== "all") {
      list = list.filter((p) => p.category === cat);
    }

    // Sort
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [products, activeTag, cat, sort]);

  // Dynamic Header Titles
  const headerMeta = useMemo(() => {
    switch (activeTag) {
      case "new":
        return {
          eyebrow: "Fresh Additions",
          title: "New Arrivals",
          subtitle: "Newly emerged from our atelier. Modern silhouettes with timeless gemstone accents.",
        };
      case "bestseller":
        return {
          eyebrow: "Loved Most",
          title: "Bestsellers",
          subtitle: "Our most coveted, treasured, and celebrated heirloom designs.",
        };
      case "limited":
        return {
          eyebrow: "Small Batch",
          title: "Limited Edition",
          subtitle: "Rare, numbered studio creations. Once gone, they will not be recast.",
        };
      default:
        return {
          eyebrow: "The Collection",
          title: "Shop Coast & Peak",
          subtitle: "Each piece is hand-finished in our studio. Quantities are kept small on purpose.",
        };
    }
  }, [activeTag]);

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pb-12 pt-32 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">
            {headerMeta.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl">{headerMeta.title}</h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg text-muted-foreground">
            {headerMeta.subtitle}
          </p>

          {/* Tag Selector Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {TAG_OPTIONS.map((t) => {
              const Icon = t.icon;
              const isActive = activeTag === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTagChange(t.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs uppercase tracking-wider font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--royal)] text-white shadow-soft scale-105"
                      : "bg-white/70 text-foreground/80 hover:bg-white border border-border"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories & Filter Bar */}
      <section className="sticky top-16 z-30 border-b border-border glass md:top-20">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 md:px-12 md:py-4">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-1">
            <Chip active={cat === "all"} onClick={() => handleCategoryChange("all")}>
              All Categories
            </Chip>
            {collections.map((c) => (
              <Chip key={c.slug} active={cat === c.slug} onClick={() => handleCategoryChange(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            {(activeTag !== "all" || cat !== "all") && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={sort}
                aria-label="Sort products"
                onChange={(e) => setSort(e.target.value as "featured" | "low" | "high")}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs sm:text-sm outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="low">Price · Low to high</option>
                <option value="high">Price · High to low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> {filtered.length === 1 ? "piece" : "pieces"}
            </p>
            {(activeTag !== "all" || cat !== "all") && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs text-[var(--royal)] hover:underline sm:hidden"
              >
                <X className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <p className="font-serif text-lg text-muted-foreground animate-pulse">Loading pieces from atelier…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-serif text-lg text-muted-foreground">
                No pieces found matching your current filter.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-xs uppercase tracking-wider text-primary-foreground"
              >
                View all pieces
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
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
        active ? "bg-primary text-primary-foreground shadow-soft font-medium" : "text-foreground/70 hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
