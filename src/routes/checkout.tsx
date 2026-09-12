import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Lock,
  CreditCard,
  Check,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useStore, type CartItem } from "@/hooks/use-store";
import { useAuth } from "@/contexts/auth-context";
import { getAccessToken } from "@/lib/auth";
import { GemstoneLoader } from "@/components/sk/Loader";
import { toast } from "sonner";
import {
  createCheckoutOrder,
  verifyPayment,
  loadRazorpayScript,
} from "@/lib/razorpay";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Coast & Peak Studio" }] }),
  component: CheckoutPage,
});

type Step = 0 | 1 | 2;
const STEPS = ["Contact", "Shipping", "Payment"] as const;

interface ConfirmedOrderDetails {
  orderNumber: string;
  paymentId?: string;
  orderId?: string;
  total: number;
  email: string;
  customerName: string;
  address: string;
  items: CartItem[];
  date: string;
  status: string;
}

function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useStore();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [processing, setProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderDetails | null>(null);
  const navigate = useNavigate();
  const shipping = 12;
  const total = cartTotal + shipping;

  const [data, setData] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    method: "razorpay" as "razorpay" | "cod",
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
    if (step < 2) {
      setStep((s) => (s + 1) as Step);
    } else {
      if (data.method === "razorpay") {
        handleRazorpayPayment();
      } else {
        handleCodPayment();
      }
    }
  };

  /**
   * STEP 2 & 3: Standard Razorpay Web Checkout Flow
   * 1. Call POST /api/create-order
   * 2. Open Razorpay modal with order_id
   * 3. On success, call POST /api/verify-payment with razorpay_order_id, razorpay_payment_id, razorpay_signature
   */
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    const toastId = toast.loading("Connecting to Razorpay Secure Gateway…");

    try {
      // 1. Ensure Razorpay script is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.dismiss(toastId);
        toast.error("Gateway Unavailable", {
          description: "Could not load Razorpay checkout script. Please check your internet connection.",
        });
        setProcessing(false);
        return;
      }

      // 2. Call backend endpoint to create order (amount in paise, minimum 100)
      const amountInPaise = Math.max(100, Math.round(total * 100));
      console.log("[Razorpay Checkout] Creating order with amount in paise:", amountInPaise);
      const orderData = await createCheckoutOrder({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      });
      console.log("[Razorpay Checkout] Received order from server:", orderData);

      toast.dismiss(toastId);

      const razorpayKeyId =
        import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_Tb5k5uSyScd9xr";

      // 3. Configure Razorpay modal options
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Coast & Peak Studio",
        description: "Handcrafted Boutique Jewelry Order",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=200&q=80",
        order_id: orderData.order_id,
        prefill: {
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
          contact: data.phone,
        },
        theme: {
          color: "#4a154b", // deep royal/wine boutique color
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info("Payment Cancelled", {
              description: "You closed the checkout modal before completing payment.",
            });
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyToast = toast.loading("Verifying payment authenticity…");
          try {
            // 4. Call backend endpoint to verify signature
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.dismiss(verifyToast);

            if (verifyRes.success) {
              let orderNumber = `CP-${Date.now().toString().slice(-6)}`;
              const orderedItems = [...cart];

              // 5. Submit confirmed order to backend
              try {
                const apiBase = (import.meta.env.VITE_API_BASE_URL || "https://coast-peak-studio.onrender.com").replace(/\/+$/, "");
                const headers: Record<string, string> = { "Content-Type": "application/json" };
                const token = getAccessToken();
                if (token) headers["Authorization"] = `Bearer ${token}`;

                const orderBackendRes = await fetch(`${apiBase}/api/orders/checkout/`, {
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
                    payment_method: "razorpay",
                    transaction_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    cart_items: orderedItems.map((i) => ({
                      product_id: i.product.id,
                      name: i.product.name,
                      price: i.product.price,
                      quantity: i.qty,
                    })),
                  }),
                });

                if (orderBackendRes.ok) {
                  const backendOrderData = await orderBackendRes.json();
                  if (backendOrderData?.order_number) {
                    orderNumber = backendOrderData.order_number;
                  }
                }
              } catch (syncErr) {
                console.warn("Backend order sync notice:", syncErr);
              }

              // 6. Record confirmed order for instant tracking
              const orderRecord: ConfirmedOrderDetails = {
                orderNumber,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                total,
                email: data.email,
                customerName: `${data.firstName} ${data.lastName}`.trim() || data.email,
                address: `${data.street}, ${data.city}, ${data.state} ${data.zip}`.replace(/^,\s*/, ""),
                items: orderedItems,
                date: new Date().toISOString(),
                status: "Order Placed & Confirmed",
              };

              try {
                const existing = JSON.parse(localStorage.getItem("cp_tracked_orders") || "[]");
                localStorage.setItem("cp_tracked_orders", JSON.stringify([orderRecord, ...existing.filter((o: any) => o.orderNumber !== orderNumber)]));
                localStorage.setItem("last_confirmed_order", JSON.stringify(orderRecord));
              } catch (storageErr) {
                console.warn("Storage error:", storageErr);
              }

              // 7. Clear cart & confirm order
              await clearCart();
              setConfirmedOrder(orderRecord);
              toast.success("Order Confirmed & Placed!", {
                description: `Order #${orderNumber} has been received.`,
              });
            }
          } catch (err: unknown) {
            toast.dismiss(verifyToast);
            const msg = (err as Error)?.message || "Payment signature verification failed.";
            toast.error("Payment Verification Failed", {
              description: msg,
            });
          } finally {
            setProcessing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure event
      rzp.on("payment.failed", (failedResp: unknown) => {
        setProcessing(false);
        const errObj = failedResp as { error?: { description?: string; code?: string } };
        toast.error("Payment Failed", {
          description: errObj?.error?.description || "Your bank or payment provider declined the transaction.",
        });
      });

      rzp.open();
    } catch (err: unknown) {
      console.error("[Razorpay Checkout Error Caught]:", err);
      toast.dismiss(toastId);
      setProcessing(false);
      const msg = (err as Error)?.message || "Failed to initiate payment. Please try again.";
      toast.error("Checkout Error", { description: msg });
    }
  };

  /**
   * Cash on Delivery fallback handler
   */
  const handleCodPayment = async () => {
    setProcessing(true);
    let orderNumber = `CP-${Date.now().toString().slice(-6)}`;
    const orderedItems = [...cart];

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
          payment_method: "cod",
          cart_items: orderedItems.map((i) => ({
            product_id: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.qty,
          })),
        }),
      });

      if (res.ok) {
        const order = await res.json();
        if (order?.order_number) {
          orderNumber = order.order_number;
        }
      }
    } catch (err) {
      console.warn("Backend order creation warning:", err);
    } finally {
      const orderRecord: ConfirmedOrderDetails = {
        orderNumber,
        total,
        email: data.email,
        customerName: `${data.firstName} ${data.lastName}`.trim() || data.email,
        address: `${data.street}, ${data.city}, ${data.state} ${data.zip}`.replace(/^,\s*/, ""),
        items: orderedItems,
        date: new Date().toISOString(),
        status: "Order Placed & Confirmed (COD)",
      };

      try {
        const existing = JSON.parse(localStorage.getItem("cp_tracked_orders") || "[]");
        localStorage.setItem("cp_tracked_orders", JSON.stringify([orderRecord, ...existing.filter((o: any) => o.orderNumber !== orderNumber)]));
        localStorage.setItem("last_confirmed_order", JSON.stringify(orderRecord));
      } catch (e) {}

      await clearCart();
      setConfirmedOrder(orderRecord);
      setProcessing(false);
      toast.success("Order Placed Successfully!", {
        description: `Order #${orderNumber} is confirmed.`,
      });
    }
  };

  // When order is confirmed, display celebratory confirmation view
  if (confirmedOrder) {
    return (
      <SiteLayout>
        <section className="bg-lavender-gradient pt-32 pb-16 md:pt-40">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 mb-6 shadow-soft animate-in zoom-in-95 duration-500">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--gold)]">
              Payment Verified &amp; Confirmed
            </p>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl text-foreground">
              Your Order is Confirmed!
            </h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Thank you, <strong className="text-foreground font-semibold">{confirmedOrder.customerName}</strong>. Your artisanal jewelry order has been received and is now entering our atelier to be handcrafted, polished, and presented in our signature velvet keepsake box.
            </p>

            <div className="mt-8 rounded-3xl border border-border bg-card p-6 sm:p-8 text-left shadow-luxe depth-3d">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground">Order Reference</span>
                  <p className="font-serif text-2xl text-foreground font-semibold">#{confirmedOrder.orderNumber}</p>
                </div>
                {confirmedOrder.paymentId && (
                  <div className="sm:text-right">
                    <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground">Razorpay Transaction</span>
                    <p className="font-mono text-xs text-[var(--royal)] font-medium">{confirmedOrder.paymentId}</p>
                  </div>
                )}
              </div>

              {/* Reserved Pieces */}
              <div className="py-6 border-b border-border space-y-4">
                <h3 className="font-serif text-sm uppercase tracking-wider text-muted-foreground">Reserved Pieces</h3>
                <div className="space-y-3">
                  {confirmedOrder.items.map((i) => (
                    <div key={i.product.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={i.product.image}
                          alt={i.product.name}
                          className="h-14 w-12 rounded-xl object-cover border border-border"
                        />
                        <div>
                          <p className="font-serif text-sm font-medium text-foreground">{i.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {i.qty}</p>
                        </div>
                      </div>
                      <span className="font-display text-base text-foreground">${i.product.price * i.qty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination & Total */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground block mb-1">
                    Shipping Destination
                  </span>
                  <p className="text-foreground font-medium">{confirmedOrder.address || "Studio Dispatch"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Notification sent to: {confirmedOrder.email}</p>
                </div>
                <div className="sm:text-right flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-muted-foreground block mb-1">
                    Total Amount
                  </span>
                  <p className="font-display text-3xl text-foreground">${confirmedOrder.total}</p>
                  {confirmedOrder.paymentId ? (
                    <span className="text-[11px] text-emerald-600 font-medium mt-0.5">✦ Paid via Razorpay Secure</span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-medium mt-0.5">✦ Pay on Delivery</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/track"
                search={{ order: confirmedOrder.orderNumber }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] px-8 py-4 text-xs uppercase tracking-[0.2em] text-white shadow-luxe depth-3d hover:scale-105 transition-transform"
              >
                <PackageCheck className="h-4 w-4" /> Track Fulfillment Progress
              </Link>
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-8 py-4 text-xs uppercase tracking-[0.2em] text-foreground hover:bg-secondary transition-colors"
              >
                <ShoppingBag className="h-4 w-4" /> Continue Shopping
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input placeholder="First name" required value={data.firstName} onChange={set("firstName")} />
                  <Input placeholder="Last name" required value={data.lastName} onChange={set("lastName")} />
                </div>
                <Input placeholder="Street address" required value={data.street} onChange={set("street")} />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input placeholder="City" required value={data.city} onChange={set("city")} />
                  <Input placeholder="State" required value={data.state} onChange={set("state")} />
                  <Input placeholder="ZIP" required value={data.zip} onChange={set("zip")} />
                </div>
              </FormBlock>
            )}
            {step === 2 && (
              <FormBlock title="Payment method">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setData((d) => ({ ...d, method: "razorpay" }))}
                    className={`rounded-2xl border p-4 text-left transition-all depth-3d ${
                      data.method === "razorpay"
                        ? "border-[var(--royal)] bg-gradient-to-br from-[var(--royal)]/10 to-[var(--wine)]/10 text-foreground font-semibold shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-[var(--royal)]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] font-medium text-foreground">Razorpay Checkout</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] font-bold">Standard</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Credit/Debit Cards, UPI, Netbanking, Wallets</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setData((d) => ({ ...d, method: "cod" }))}
                    className={`rounded-2xl border p-4 text-left transition-all depth-3d ${
                      data.method === "cod"
                        ? "border-[var(--royal)] bg-gradient-to-br from-[var(--royal)]/10 to-[var(--wine)]/10 text-foreground font-semibold shadow-sm"
                        : "border-border bg-card text-muted-foreground hover:border-[var(--royal)]/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs uppercase tracking-[0.2em] font-medium text-foreground">Cash on Delivery</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">India</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Pay in cash when your velvet box arrives</p>
                  </button>
                </div>

                {data.method === "razorpay" && (
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3 depth-3d">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--royal)] font-semibold">
                        <CreditCard className="h-4 w-4" /> Razorpay Standard Web Checkout
                      </div>
                      <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">Test Mode Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Clicking <strong>&ldquo;Pay ${total} with Razorpay&rdquo;</strong> will launch the Razorpay popup modal with full support for Cards, Google Pay / PhonePe / Paytm UPI, Net Banking, and Wallets.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> 256-bit SSL encrypted</span>
                      <span>•</span>
                      <span>Instant HMAC-SHA256 signature verification</span>
                      <span>•</span>
                      <span>No card details stored on server</span>
                    </div>
                  </div>
                )}

                {data.method === "cod" && (
                  <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    Pay in cash when your velvet box arrives. Available across India.
                  </p>
                )}
              </FormBlock>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-xs uppercase tracking-[0.2em] hover:bg-secondary order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              <button
                type="submit"
                disabled={processing || (step < 2 && cart.length === 0)}
                className="flex flex-1 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] py-4 text-sm uppercase tracking-[0.2em] text-white shadow-luxe depth-3d transition-transform duration-300 ease-luxe hover:scale-[1.01] disabled:opacity-60 order-1 sm:order-2 cursor-pointer"
              >
                {processing ? (
                  <GemstoneLoader />
                ) : step < 2 ? (
                  <>Continue <ChevronRight className="h-4 w-4" /></>
                ) : data.method === "razorpay" ? (
                  <>Pay ${total} with Razorpay</>
                ) : (
                  <>Place Cash on Delivery Order</>
                )}
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
