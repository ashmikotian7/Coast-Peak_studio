import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import { useStore } from "@/hooks/use-store";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, toggleWishlist, isWished } = useStore();
  const wished = isWished(product.id);

  return (
    <div
      className="group relative animate-fade-up [perspective:1200px]"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <Link to="/product/$id" params={{ id: product.id }} className="block">
        <div className="tilt-3d relative overflow-hidden rounded-[28px] bg-muted shadow-soft depth-3d">
          {product.tag && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-gold-gradient px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[oklch(0.2_0.06_305)] shadow-gold">
              {product.tag}
            </span>
          )}
          <button
            type="button"
            aria-label="Add to wishlist"
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
              toast(wished ? "Removed from wishlist" : "Added to wishlist", {
                description: product.name,
              });
            }}
            className={`absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full glass transition-all duration-300 ease-luxe hover:scale-110 ${
              wished ? "text-[var(--wine)]" : "text-foreground/70"
            }`}
          >
            <Heart className={`h-[18px] w-[18px] transition-transform duration-300 ${wished ? "scale-110 fill-current" : ""}`} />
          </button>

          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              width={1024}
              height={1280}
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-luxe group-hover:scale-110"
            />
          </div>

          {/* Mobile quick add button */}
          <button
            type="button"
            aria-label="Quick add to cart"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
              toast.success("Added to cart", { description: product.name });
            }}
            className="sm:hidden absolute right-3 bottom-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full glass text-foreground shadow-soft transition-transform active:scale-90"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>

          {/* Desktop quick add hover bar */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
              toast.success("Added to cart", { description: product.name });
            }}
            className="hidden sm:inline-flex absolute inset-x-4 bottom-4 translate-y-3 items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-medium text-background opacity-0 shadow-luxe transition-all duration-500 ease-luxe group-hover:translate-y-0 group-hover:opacity-100"
          >
            <ShoppingBag className="h-4 w-4" /> Quick add
          </button>
        </div>

        <div className="mt-3 sm:mt-4 flex items-start justify-between gap-2 px-1">
          <div className="min-w-0">
            <h3 className="font-display text-base sm:text-xl leading-tight truncate">{product.name}</h3>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {product.category}
            </p>
          </div>
          <p className="font-display text-base sm:text-xl text-gold-gradient shrink-0 font-medium">${product.price}</p>
        </div>
      </Link>
    </div>
  );
}
