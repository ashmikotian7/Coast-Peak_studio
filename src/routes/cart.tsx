import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, Trash2, ArrowRight, RotateCcw } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useStore } from "@/hooks/use-store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — Coast & Peak Studio" },
      { name: "description", content: "Your Coast & Peak cart" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart, cartTotal, isLoadingCart } = useStore();
  const shipping = cart.length ? 12 : 0;
  const total = cartTotal + shipping;

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">
            Your selection
          </p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Velvet Cart</h1>
          {cart.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground font-serif">
              {cart.length} {cart.length === 1 ? "item" : "items"} in your box
            </p>
          )}
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {isLoadingCart && cart.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <p className="font-serif text-lg text-muted-foreground animate-pulse">
                Opening your velvet cart…
              </p>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <Heart className="h-10 w-10 text-[var(--royal)]" />
              </div>
              <h2 className="mt-8 font-display text-3xl">Your cart awaits its first heirloom.</h2>
              <p className="mt-2 text-muted-foreground font-serif">
                Explore our collections and choose pieces to grace your collection.
              </p>
              <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground shadow-soft"
              >
                Browse collection <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-serif text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Selected Items
                  </span>
                  <button
                    type="button"
                    onClick={() => clearCart()}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Empty cart
                  </button>
                </div>

                <ul className="space-y-4">
                  {cart.map((item) => {
                    const identifier = item.id ?? item.product.id;
                    const isLowStock = item.product.stock > 0 && item.product.stock <= 3;
                    const isOutOfStock = item.product.stock <= 0;

                    return (
                      <li
                        key={item.id ?? item.product.id}
                        className="flex gap-3 sm:gap-4 rounded-3xl border border-border bg-card p-3 sm:p-4 shadow-soft"
                      >
                        <Link to="/product/$id" params={{ id: item.product.id }} className="shrink-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            width={120}
                            height={150}
                            loading="lazy"
                            className="h-24 w-20 rounded-2xl object-cover sm:h-32 sm:w-28"
                          />
                        </Link>
                        <div className="flex flex-1 flex-col min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <h3 className="font-display text-lg sm:text-xl truncate">{item.product.name}</h3>
                              <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                {item.product.category}
                              </p>
                              {isOutOfStock ? (
                                <span className="mt-1 inline-block rounded-full bg-destructive/10 px-2.5 py-0.5 text-[10px] font-semibold text-destructive">
                                  Out of stock
                                </span>
                              ) : isLowStock ? (
                                <span className="mt-1 inline-block rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-600">
                                  Only {item.product.stock} left in atelier
                                </span>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(identifier)}
                              aria-label="Remove"
                              className="text-muted-foreground transition-colors hover:text-destructive shrink-0 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                            <div className="inline-flex items-center rounded-full border border-border bg-background">
                              <button
                                type="button"
                                onClick={() => updateQty(identifier, item.qty - 1)}
                                className="p-1.5 sm:p-2 text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-7 sm:w-8 text-center font-serif text-sm">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => updateQty(identifier, item.qty + 1)}
                                className="p-1.5 sm:p-2 text-muted-foreground transition-colors hover:text-foreground"
                                aria-label="Increase quantity"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="font-display text-lg sm:text-xl text-gold-gradient">
                              ${item.item_total ?? item.product.price * item.qty}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <aside className="h-fit rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft md:sticky md:top-28">
                <h2 className="font-display text-2xl">Order summary</h2>
                <dl className="mt-6 space-y-3 font-serif">
                  <Row label="Subtotal" value={`$${cartTotal}`} />
                  <Row label="Shipping" value={`$${shipping}`} />
                  <div className="border-t border-border pt-3">
                    <Row label="Total" value={`$${total}`} bold />
                  </div>
                </dl>
                <div className="mt-6 rounded-2xl bg-secondary p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Coupon</p>
                  <div className="mt-2 flex gap-2">
                    <input
                      placeholder="SKVELVET"
                      className="flex-1 min-w-0 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-[var(--royal)]"
                    />
                    <button
                      type="button"
                      className="rounded-full bg-foreground px-4 py-2 text-sm text-background transition-opacity hover:opacity-90 shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <Link
                  to="/checkout"
                  className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm uppercase tracking-[0.2em] text-primary-foreground shadow-soft transition-transform duration-200 hover:scale-[1.01]"
                >
                  Secure checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "font-display text-xl" : "text-muted-foreground"
      }`}
    >
      <dt>{label}</dt>
      <dd className={bold ? "text-foreground" : ""}>{value}</dd>
    </div>
  );
}
