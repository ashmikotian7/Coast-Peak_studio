import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, CreditCard } from "lucide-react";
import { useState } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useStore } from "@/hooks/use-store";
import { GemstoneLoader } from "@/components/sk/Loader";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — SK" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, cartTotal } = useStore();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const shipping = 12;
  const total = cartTotal + shipping;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      toast.success("Order placed", { description: "Your velvet box is on its way." });
      navigate({ to: "/track" });
    }, 2200);
  };

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]"><Lock className="mr-1 inline h-3 w-3" /> Secure checkout</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Almost yours</h1>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-5 md:px-12">
          <form onSubmit={handlePay} className="space-y-8 md:col-span-3">
            <FormBlock title="Contact">
              <Input placeholder="Email" type="email" required />
              <Input placeholder="Phone (optional)" />
            </FormBlock>
            <FormBlock title="Shipping address">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First name" required />
                <Input placeholder="Last name" required />
              </div>
              <Input placeholder="Street address" required />
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="City" required />
                <Input placeholder="State" required />
                <Input placeholder="ZIP" required />
              </div>
            </FormBlock>
            <FormBlock title="Payment">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" /> Card details
                </div>
                <Input placeholder="Card number" className="mt-3" />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input placeholder="MM / YY" />
                  <Input placeholder="CVC" />
                </div>
              </div>
            </FormBlock>

            <button
              type="submit"
              disabled={processing || cart.length === 0}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-primary py-4 text-sm uppercase tracking-[0.2em] text-primary-foreground shadow-soft transition-transform duration-300 ease-luxe hover:scale-[1.01] disabled:opacity-60"
            >
              {processing ? <GemstoneLoader /> : <>Place order · ${total}</>}
            </button>
          </form>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft md:col-span-2 md:sticky md:top-28">
            <h2 className="font-display text-2xl">Your pieces</h2>
            <ul className="mt-4 space-y-3">
              {cart.length === 0 && <li className="text-sm text-muted-foreground">Cart is empty. <Link to="/shop" className="story-link">Browse</Link></li>}
              {cart.map((i) => (
                <li key={i.product.id} className="flex items-center gap-3">
                  <img src={i.product.image} alt={i.product.name} loading="lazy" width={64} height={80} className="h-16 w-14 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="font-serif">{i.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {i.qty}</p>
                  </div>
                  <p className="font-display">${i.product.price * i.qty}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <Row label="Subtotal" value={`$${cartTotal}`} />
              <Row label="Shipping" value={`$${shipping}`} />
              <Row label="Total" value={`$${total}`} bold />
            </div>
          </aside>
        </div>
      </section>
    </SiteLayout>
  );
}

function FormBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 font-display text-xl">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
function Input({ className = "", ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`w-full rounded-full border border-border bg-background px-4 py-3 text-sm outline-none transition-all duration-200 focus:border-[var(--royal)] ${className}`} />;
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-display text-lg text-foreground" : "text-muted-foreground"}`}><span>{label}</span><span>{value}</span></div>;
}
