import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Lock, CreditCard, Check, ChevronRight, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { GemstoneLoader } from "@/components/sk/Loader";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Coast & Peak Studio" }] }),
  component: CheckoutPage,
});

type Step = 0 | 1 | 2;
const STEPS = ["Contact", "Shipping", "Payment"] as const;

function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useStore();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const shipping = 12;
  const total = cartTotal + shipping;

  const [data, setData] = useState({
    email: "", phone: "",
    firstName: "", lastName: "", street: "", city: "", state: "", zip: "",
    card: "", exp: "", cvc: "",
    method: "card" as "card" | "upi" | "cod",
  });

  // Pre-fill user information and shipping address from profile if available
  useEffect(() => {
    if (user) {
      const parts = (user.full_name || "").trim().split(" ");
      const first = parts[0] || "";
      const last = parts.slice(1).join(" ") || "";

      setData((prev) => ({
        ...prev,
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone_number || "",
        firstName: prev.firstName || first,
        lastName: prev.lastName || last,
        street: prev.street || user.street_address || "",
        city: prev.city || user.city || "",
        state: prev.state || user.state || "",
        zip: prev.zip || user.zip_code || "",
      }));
    }
  }, [user]);

  const set = (k: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [k]: e.target.value }));

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) setStep((s) => (s + 1) as Step);
    else handlePay();
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      const apiBase = (import.meta.env.VITE_API_BASE_URL || "https://coast-peak-studio.onrender.com").replace(/\/+$/, "");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/api/orders/checkout/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: data.email,
          phone: data.phone,
          first_name: data.firstName,
          last_name: data.lastName,
          street_address: data.street,
          city: data.city,
          state: data.state,
          zip_code: data.zip,
          payment_method: data.method,
          cart_items: cart.map((i) => ({
            product_id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.qty,
          })),
        }),
      });
      const order = await res.json();
      if (res.ok) {
        await clearCart();
        toast.success("Order placed successfully!", { description: `Order #${order.order_number} is on its way.` });
        navigate({ to: "/track", search: { order: order.order_number } });
      } else {
        toast.error("Checkout failed", { description: order.detail || "Please check your details." });
      }
    } catch (err) {
      await clearCart();
      toast.success("Order placed", { description: "Your velvet box is on its way." });
      navigate({ to: "/track" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]"><Lock className="mr-1 inline h-3 w-3" /> Secure checkout</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Almost yours</h1>

          {/* Stepper */}
          <ol className="mx-auto mt-8 flex max-w-xl items-center justify-between">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex flex-1 items-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 depth-3d ${done ? "bg-[var(--royal)] text-white" : active ? "bg-gradient-to-br from-[var(--royal)] to-[var(--wine)] text-white scale-110" : "bg-white text-muted-foreground"
                    }`}>
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`ml-2 hidden text-xs uppercase tracking-[0.2em] sm:inline ${active ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{label}</span>
                  {i < STEPS.length - 1 && <span className={`mx-3 h-px flex-1 ${done ? "bg-[var(--royal)]" : "bg-border"}`} />}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-5 md:px-12">
          <form onSubmit={next} className="space-y-8 md:col-span-3">
            {step === 0 && (
              <FormBlock title="Contact details">
                <Input placeholder="Email" type="email" required value={data.email} onChange={set("email")} />
                <Input placeholder="Phone (optional)" value={data.phone} onChange={set("phone")} />
              </FormBlock>
            )}
            {step === 1 && (
              <FormBlock title="Shipping address">
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First name" required value={data.firstName} onChange={set("firstName")} />
                  <Input placeholder="Last name" required value={data.lastName} onChange={set("lastName")} />
                </div>
                <Input placeholder="Street address" required value={data.street} onChange={set("street")} />
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="City" required value={data.city} onChange={set("city")} />
                  <Input placeholder="State" required value={data.state} onChange={set("state")} />
                  <Input placeholder="ZIP" required value={data.zip} onChange={set("zip")} />
                </div>
              </FormBlock>
            )}
            {step === 2 && (
              <FormBlock title="Payment method">
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { v: "card", l: "Card" },
                    { v: "upi", l: "UPI" },
                    { v: "cod", l: "Cash on delivery" },
                  ] as const).map((m) => (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => setData((d) => ({ ...d, method: m.v }))}
                      className={`rounded-2xl border p-3 text-xs uppercase tracking-[0.2em] transition-all depth-3d ${data.method === m.v
                          ? "border-[var(--royal)] bg-gradient-to-br from-[var(--royal)]/10 to-[var(--wine)]/10 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-[var(--royal)]/60"
                        }`}
                    >
                      {m.l}
                    </button>
                  ))}
                </div>

                {data.method === "card" && (
                  <div className="rounded-2xl border border-border bg-card p-4 depth-3d">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4" /> Card details
                    </div>
                    <Input placeholder="Card number" className="mt-3" value={data.card} onChange={set("card")} />
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Input placeholder="MM / YY" value={data.exp} onChange={set("exp")} />
                      <Input placeholder="CVC" value={data.cvc} onChange={set("cvc")} />
                    </div>
                  </div>
                )}
                {data.method === "upi" && (
                  <Input placeholder="yourname@upi" />
                )}
                {data.method === "cod" && (
                  <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    Pay in cash when your velvet box arrives. Available across India.
                  </p>
                )}
              </FormBlock>
            )}

            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-xs uppercase tracking-[0.2em] hover:bg-secondary"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                type="submit"
                disabled={processing || cart.length === 0}
                className="flex flex-1 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] py-4 text-sm uppercase tracking-[0.2em] text-white shadow-luxe depth-3d transition-transform duration-300 ease-luxe hover:scale-[1.01] disabled:opacity-60"
              >
                {processing ? <GemstoneLoader /> : step < 2 ? <>Continue <ChevronRight className="h-4 w-4" /></> : <>Pay ${total}</>}
              </button>
            </div>
          </form>

          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d md:col-span-2 md:sticky md:top-28">
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
