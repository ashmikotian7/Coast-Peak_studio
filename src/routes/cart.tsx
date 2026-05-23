import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useStore } from "@/hooks/use-store";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — SK" }, { name: "description", content: "Your SK cart" }] }),
  component: CartPage,
});

function CartPage() {
  const { cart, updateQty, removeFromCart, cartTotal } = useStore();
  const shipping = cart.length ? 12 : 0;
  const total = cartTotal + shipping;

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">Your selection</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Velvet Cart</h1>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
                <Heart className="h-10 w-10 text-[var(--royal)]" />
              </div>
              <h2 className="mt-8 font-display text-3xl">Your cart awaits its first heirloom.</h2>
              <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm uppercase tracking-[0.2em] text-primary-foreground"
              >
                Browse collection <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 md:grid-cols-3">
              <div className="md:col-span-2">
                <ul className="space-y-4">
                  {cart.map((item) => (
                    <li key={item.product.id} className="flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
                      <Link to="/product/$id" params={{ id: item.product.id }} className="shrink-0">
                        <img src={item.product.image} alt={item.product.name} width={120} height={150} loading="lazy" className="h-28 w-24 rounded-2xl object-cover md:h-32 md:w-28" />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <div>
                            <h3 className="font-display text-xl">{item.product.name}</h3>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.product.category}</p>
                          </div>
                          <button onClick={() => removeFromCart(item.product.id)} aria-label="Remove" className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-end justify-between">
                          <div className="inline-flex items-center rounded-full border border-border">
                            <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                            <span className="w-8 text-center font-serif">{item.qty}</span>
                            <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                          </div>
                          <p className="font-display text-xl text-gold-gradient">${item.product.price * item.qty}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft md:sticky md:top-28">
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
                    <input placeholder="SKVELVET" className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none" />
                    <button className="rounded-full bg-foreground px-4 py-2 text-sm text-background">Apply</button>
                  </div>
                </div>
                <Link to="/checkout" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm uppercase tracking-[0.2em] text-primary-foreground shadow-soft">
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
    <div className={`flex justify-between ${bold ? "font-display text-xl" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd className={bold ? "text-foreground" : ""}>{value}</dd>
    </div>
  );
}
