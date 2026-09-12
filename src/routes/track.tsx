import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Truck,
  MapPin,
  User as UserIcon,
  AlertCircle,
  ShoppingBag,
  Gem,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useAuth } from "@/contexts/auth-context";
import {
  trackByCustomerAndProduct,
  type TrackingResponse,
  type DropdownOrderProduct,
  type UserTrackedOrdersResponse,
} from "@/lib/orders-api";
import { getFallbackImage } from "@/lib/products";
import { toast } from "sonner";

interface TrackSearchParams {
  order?: string;
  product?: string;
}

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): TrackSearchParams => ({
    order: typeof search.order === "string" ? search.order : undefined,
    product: typeof search.product === "string" ? search.product : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Order — Coast & Peak Studio" },
      { name: "description", content: "Track the fulfillment journey of your heirloom jewelry piece across all three atelier stages." },
    ],
  }),
  component: TrackPage,
});

// The 3 customer-facing tracking stages
export const CUSTOMER_STAGES = [
  {
    key: "placed",
    title: "Order Placed",
    description: "Your order has been received and confirmed by the atelier.",
  },
  {
    key: "preparing",
    title: "Preparing Order",
    description: "Our artisan jewelers are hand-finishing and preparing your piece.",
  },
  {
    key: "sent",
    title: "Order Sent",
    description: "Your velvet box has been dispatched and is on its way to your destination.",
  },
] as const;

function getCustomerStageIndex(status: string): number {
  const s = (status || "").toLowerCase().trim();
  if (s === "shipped" || s === "sent" || s === "dispatched" || s === "delivered") return 2;
  if (s === "preparing" || s === "crafting" || s === "packed") return 1;
  return 0; // "placed" is default
}

export default function TrackPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Search form inputs
  const [inputOrderNum, setInputOrderNum] = useState<string>(searchParams.order || "");
  const [guestEmail, setGuestEmail] = useState<string>("");

  // Tracking state
  const [userOrders, setUserOrders] = useState<TrackingResponse[]>([]);
  const [activeTracking, setActiveTracking] = useState<TrackingResponse | null>(null);
  const [selectedOrderNum, setSelectedOrderNum] = useState<string>(searchParams.order || "");
  const [selectedProductId, setSelectedProductId] = useState<string>(searchParams.product || "all");

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Extract all distinct purchased products across the user's orders
  const userProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image?: string | null; price: number }>();
    for (const ord of userOrders) {
      for (const p of ord.products || []) {
        const idStr = String(p.id);
        if (!map.has(idStr)) {
          map.set(idStr, {
            id: idStr,
            name: p.name,
            image: p.image,
            price: Number(p.price) || 0,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [userOrders]);

  // Load orders according to User logged in and Product filter
  const loadTrackingData = useCallback(
    async (override?: { orderNumber?: string; email?: string; productId?: string }) => {
      setLoading(true);
      setErrorMessage("");

      const effectiveEmail = override?.email !== undefined
        ? override.email
        : (user?.email || guestEmail || undefined);

      const effectiveOrder = override?.orderNumber !== undefined
        ? override.orderNumber
        : (selectedOrderNum || searchParams.order || undefined);

      const effectiveProduct = override?.productId !== undefined
        ? override.productId
        : selectedProductId;

      const prodParam = effectiveProduct && effectiveProduct !== "all" ? effectiveProduct : undefined;

      try {
        // If neither email nor orderNumber is provided, we cannot query the backend
        if (!effectiveEmail && !effectiveOrder) {
          setUserOrders([]);
          setActiveTracking(null);
          setLoading(false);
          return;
        }

        const data = await trackByCustomerAndProduct({
          email: effectiveEmail,
          orderNumber: effectiveOrder,
          productId: prodParam,
        });

        // 1. Multi-order response for user
        if ("orders" in data && Array.isArray(data.orders)) {
          const list = data.orders;
          setUserOrders(list);

          if (list.length > 0) {
            // Find active order or default to first
            const matched = effectiveOrder
              ? list.find(
                  (o) =>
                    o.order_number.toLowerCase() === effectiveOrder.toLowerCase() ||
                    o.order_number.toLowerCase().endsWith(effectiveOrder.toLowerCase())
                )
              : null;
            const target = matched || list[0];
            setActiveTracking(target);
            setSelectedOrderNum(target.order_number);
            setInputOrderNum(target.order_number);
          } else {
            setActiveTracking(null);
            setErrorMessage(
              prodParam
                ? "No orders found matching this piece."
                : "No orders found for this account."
            );
          }
        }
        // 2. Single order response
        else if ("order_number" in data && (data as TrackingResponse).order_number) {
          const single = data as TrackingResponse;
          setActiveTracking(single);
          setSelectedOrderNum(single.order_number);
          setInputOrderNum(single.order_number);
          setUserOrders((prev) => {
            const exists = prev.some((o) => o.order_number === single.order_number);
            return exists ? prev : [single, ...prev];
          });
        }
      } catch (err: any) {
        // Fallback: check locally confirmed orders
        try {
          const localOrders = JSON.parse(localStorage.getItem("cp_tracked_orders") || "[]");
          const found = localOrders.find((lo: any) =>
            (effectiveOrder && (lo.orderNumber.toLowerCase() === effectiveOrder.toLowerCase() || lo.orderNumber.toLowerCase().endsWith(effectiveOrder.toLowerCase()))) ||
            (effectiveEmail && lo.email.toLowerCase() === effectiveEmail.toLowerCase())
          );
          if (found) {
            const localTrackingResp: TrackingResponse = {
              id: found.orderNumber,
              order_number: found.orderNumber,
              status: "placed",
              status_display: "Order Placed & Confirmed",
              created_at: found.date,
              total_amount: found.total,
              products: (found.items || []).map((i: any) => ({
                id: i.product?.id || "item",
                name: i.product?.name || "Artisan Jewelry Piece",
                price: i.product?.price || 0,
                quantity: i.qty || 1,
                item_total: (i.product?.price || 0) * (i.qty || 1),
                image: i.product?.image || null,
              })),
              user: {
                name: found.customerName || "Collector",
                email: found.email || "",
              },
            };
            setActiveTracking(localTrackingResp);
            setSelectedOrderNum(found.orderNumber);
            setInputOrderNum(found.orderNumber);
            setUserOrders((prev) => [localTrackingResp, ...prev.filter((o) => o.order_number !== found.orderNumber)]);
            setErrorMessage("");
            return;
          }
        } catch (localErr) {
          console.warn("Local tracking fallback notice:", localErr);
        }

        setActiveTracking(null);
        setErrorMessage(err.message || "Failed to retrieve tracking details.");
      } finally {
        setLoading(false);
      }
    },
    [user?.email, guestEmail, selectedOrderNum, searchParams.order, selectedProductId]
  );

  // Initial load when user email or search params change
  useEffect(() => {
    loadTrackingData({
      orderNumber: searchParams.order,
      productId: searchParams.product,
      email: user?.email,
    });
  }, [user?.email, searchParams.order, searchParams.product]);

  // Handle Form Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOrder = inputOrderNum.trim();
    const cleanEmail = (guestEmail || user?.email || "").trim();

    if (!cleanOrder && !cleanEmail) {
      toast.error("Please enter an Order Number or Email");
      return;
    }

    setSelectedOrderNum(cleanOrder);
    loadTrackingData({
      orderNumber: cleanOrder || undefined,
      email: cleanEmail || undefined,
      productId: selectedProductId !== "all" ? selectedProductId : undefined,
    });

    if (cleanOrder) {
      navigate({
        to: "/track",
        search: {
          order: cleanOrder,
          product: selectedProductId !== "all" ? selectedProductId : undefined,
        },
        replace: true,
      });
    }
  };

  // Handle Product Filter Selection
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    loadTrackingData({ productId });
    navigate({
      to: "/track",
      search: {
        order: selectedOrderNum || undefined,
        product: productId !== "all" ? productId : undefined,
      },
      replace: true,
    });
  };

  // Handle Order Selection from Dropdown / List
  const handleOrderChange = (orderNum: string) => {
    setSelectedOrderNum(orderNum);
    setInputOrderNum(orderNum);
    const found = userOrders.find((o) => o.order_number === orderNum);
    if (found) {
      setActiveTracking(found);
    } else {
      loadTrackingData({ orderNumber: orderNum });
    }
    navigate({
      to: "/track",
      search: {
        order: orderNum,
        product: selectedProductId !== "all" ? selectedProductId : undefined,
      },
      replace: true,
    });
  };

  // Active stage determination
  const activeStageIdx = activeTracking
    ? getCustomerStageIndex(activeTracking.current_status)
    : 0;
  const activeStageConfig = CUSTOMER_STAGES[activeStageIdx] || CUSTOMER_STAGES[0];

  return (
    <SiteLayout>
      {/* Header Banner */}
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          {/* User Logged-in Status Indicator */}
          {isAuthenticated && user ? (
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--royal)]/20 bg-background/80 px-4 py-1.5 text-xs font-serif text-[var(--royal)] shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Tracking commissions for <strong>{user.name || user.email}</strong>
              </span>
            </div>
          ) : (
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">
              Live Atelier Tracking
            </p>
          )}

          <h1 className="mt-2 font-display text-5xl md:text-6xl">Tracking Your Treasure</h1>
          <p className="mx-auto mt-3 max-w-xl font-serif text-muted-foreground">
            Follow the passage of your heirloom piece across the 3 stages: Order Placed, Preparing Order, and Order Sent.
          </p>

          {/* Search Bar: Order # & Optional Guest Email */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2.5 sm:flex-row sm:items-center rounded-3xl sm:rounded-full border border-border bg-card p-2 shadow-soft backdrop-blur-md"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={inputOrderNum}
                onChange={(e) => setInputOrderNum(e.target.value)}
                placeholder="Order # e.g. CP-2026-1025 or 1025"
                className="w-full bg-transparent pl-11 pr-4 py-2 font-mono text-sm outline-none placeholder:font-serif placeholder:text-muted-foreground"
              />
            </div>

            {!isAuthenticated && (
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Email (optional)"
                className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-border bg-transparent px-4 py-2 text-sm font-serif outline-none placeholder:text-muted-foreground"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-soft transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" /> Track
            </button>
          </form>

          {/* User's Order Dropdown Selector (if user has orders) */}
          {userOrders.length > 1 && (
            <div className="mx-auto mt-5 max-w-xl text-left">
              <label className="mb-1.5 block text-center font-serif text-xs uppercase tracking-wider text-muted-foreground">
                Your Atelier Orders ({userOrders.length}):
              </label>
              <div className="relative">
                <select
                  value={selectedOrderNum}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-border bg-card px-4 py-2.5 pr-10 text-sm font-serif outline-none transition-all focus:border-[var(--royal)] shadow-sm cursor-pointer"
                >
                  {userOrders.map((ord) => {
                    const stage = CUSTOMER_STAGES[getCustomerStageIndex(ord.current_status)].title;
                    return (
                      <option key={ord.order_number} value={ord.order_number}>
                        Order #{ord.order_number} — {stage} ({ord.products.length} {ord.products.length === 1 ? "piece" : "pieces"}, ${Number(ord.summary.total_amount).toFixed(2)})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Product Filter Bar: Track by Purchased Product / Piece */}
          {userProducts.length > 0 && (
            <div className="mx-auto mt-6 max-w-2xl">
              <div className="flex items-center justify-center gap-1.5 mb-2.5 text-xs uppercase tracking-wider text-muted-foreground">
                <Filter className="h-3 w-3 text-[var(--royal)]" />
                <span>Track According to Purchased Piece:</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleProductSelect("all")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    selectedProductId === "all"
                      ? "bg-[var(--royal)] text-white shadow-soft"
                      : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  All Pieces ({userOrders.reduce((sum, o) => sum + (o.products?.length || 0), 0)})
                </button>

                {userProducts.map((prod) => {
                  const isSelected = selectedProductId === prod.id;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleProductSelect(prod.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[var(--royal)] text-white shadow-soft"
                          : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-4 w-4 rounded-full object-cover border border-white/40"
                        />
                      ) : (
                        <Gem className="h-3 w-3 text-[var(--royal)]" />
                      )}
                      <span>{prod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-6 md:px-12">
          {/* Refresh Action */}
          {activeTracking && (
            <div className="mb-6 flex items-center justify-between">
              <p className="font-serif text-xs text-muted-foreground">
                Verified with studio fulfillment ledger
              </p>
              <button
                onClick={() => {
                  loadTrackingData();
                  toast.success("Tracking status refreshed");
                }}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shadow-sm"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Status</span>
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-secondary text-[var(--royal)]">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-2xl">Retrieving shipping dispatch…</h3>
              <p className="font-serif text-sm text-muted-foreground">Connecting with atelier tracking</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-soft">
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h3 className="mt-3 font-display text-2xl text-destructive">Order Not Found</h3>
              <p className="mt-1 font-serif text-sm text-muted-foreground">{errorMessage}</p>
              {selectedProductId !== "all" && (
                <button
                  onClick={() => handleProductSelect("all")}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  <RotateCcw className="h-3 w-3" /> View all pieces for this order
                </button>
              )}
            </div>
          ) : activeTracking ? (
            <div className="space-y-8">
              {/* Order Status Header Card */}
              <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-base font-bold text-[var(--royal)]">
                      Order #{activeTracking.order_number}
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      {activeTracking.current_status_display || activeStageConfig.title}
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-xs text-muted-foreground">
                    Placed on{" "}
                    {new Date(activeTracking.created_at).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Total Value</span>
                  <p className="font-display text-2xl text-gold-gradient">
                    ${Number(activeTracking.summary.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* 3-Step Live Tracking Timeline */}
              <div className="rounded-3xl border border-border bg-card p-8 shadow-soft">
                <h2 className="font-display text-2xl">Journey of Your Heirloom</h2>
                <p className="mt-1 font-serif text-sm text-muted-foreground">
                  Current Status: <strong className="text-foreground">{activeTracking.current_status_display || activeStageConfig.title}</strong>
                </p>

                <ol className="relative mt-8 space-y-8">
                  <span className="absolute left-6 top-3 bottom-3 w-0.5 bg-border" aria-hidden />

                  {CUSTOMER_STAGES.map((step, idx) => {
                    const isCompleted = idx < activeStageIdx;
                    const isCurrent = idx === activeStageIdx;
                    const isSentStage = idx === 2 && isCurrent;

                    return (
                      <li key={step.key} className="relative flex items-start gap-3 sm:gap-5 pl-1 sm:pl-2">
                        <div
                          className={`relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                            isCompleted || isSentStage
                              ? "bg-gradient-to-br from-[var(--royal)] to-[var(--wine)] text-white shadow-soft"
                              : isCurrent
                              ? "bg-amber-500 text-white shadow-gold ring-4 ring-amber-100 dark:ring-amber-950 animate-pulse"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {isCompleted || isSentStage ? (
                            <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : isCurrent ? (
                            <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
                          ) : (
                            <Circle className="h-4 w-4 sm:h-5 sm:w-5 opacity-60" />
                          )}
                        </div>

                        <div className="pt-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <h3
                              className={`font-display text-lg sm:text-xl ${
                                isCurrent
                                  ? "text-[var(--royal)] font-bold"
                                  : isCompleted
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {step.title}
                            </h3>
                            {isSentStage ? (
                              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                                Dispatched
                              </span>
                            ) : isCurrent ? (
                              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                In Progress
                              </span>
                            ) : isCompleted ? (
                              <span className="text-xs font-semibold text-emerald-600">
                                Completed
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 font-serif text-xs sm:text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* Customer & Destination Details */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Customer Information */}
                <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[var(--royal)]">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl">Customer Details</h3>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Recipient</p>
                    </div>
                  </div>
                  <div className="font-serif text-sm space-y-1.5 text-foreground/80">
                    <p className="font-medium text-foreground">{activeTracking.user.name || "Valued Collector"}</p>
                    <p className="break-all">{activeTracking.user.email}</p>
                    {activeTracking.user.phone && <p className="font-mono text-xs">{activeTracking.user.phone}</p>}
                  </div>
                </div>

                {/* Destination Shipping Address */}
                <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[var(--royal)]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl">Shipping Destination</h3>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Vault Address</p>
                    </div>
                  </div>
                  <div className="font-serif text-sm space-y-1 text-foreground/80">
                    {activeTracking.user.shipping_address?.street ? (
                      <>
                        <p>{activeTracking.user.shipping_address.street}</p>
                        <p>
                          {[
                            activeTracking.user.shipping_address.city,
                            activeTracking.user.shipping_address.state,
                            activeTracking.user.shipping_address.zip_code,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground italic">Standard Studio Delivery</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Products in this Order */}
              <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[var(--royal)]" />
                    <h3 className="font-display text-lg sm:text-xl">
                      Pieces in this Order ({activeTracking.products.length})
                    </h3>
                  </div>
                  {selectedProductId !== "all" && (
                    <span className="rounded-full bg-[var(--royal)]/10 text-[var(--royal)] px-3 py-0.5 text-xs font-medium">
                      Piece Filter Active
                    </span>
                  )}
                </div>

                <ul className="divide-y divide-border">
                  {activeTracking.products.map((item) => {
                    const isFilteredPiece = selectedProductId === String(item.id);
                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 sm:gap-4 py-3.5 px-2 sm:px-3 rounded-2xl transition-colors ${
                          isFilteredPiece ? "bg-[var(--royal)]/5 ring-1 ring-[var(--royal)]/20" : ""
                        }`}
                      >
                        <img
                          src={item.image || getFallbackImage()}
                          alt={item.name}
                          className="h-12 w-11 sm:h-16 sm:w-14 rounded-xl object-cover border border-border shadow-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-display text-sm sm:text-base truncate">{item.name}</h4>
                            {isFilteredPiece && (
                              <span className="rounded-full bg-[var(--royal)] text-white text-[9px] px-2 py-0.5 uppercase tracking-wider font-semibold">
                                Selected Piece
                              </span>
                            )}
                          </div>
                          <p className="font-serif text-xs text-muted-foreground">
                            Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-display text-base sm:text-lg text-gold-gradient">
                            ${Number(item.item_total).toFixed(2)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Financial Summary */}
                <div className="mt-6 border-t border-border pt-4 space-y-2 text-sm font-serif">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${Number(activeTracking.summary.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Signature Shipping</span>
                    <span>${Number(activeTracking.summary.shipping_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Payment Method</span>
                    <span className="font-medium text-foreground">{activeTracking.summary.payment_method}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 font-display text-xl text-foreground">
                    <span>Total Amount</span>
                    <span className="text-gold-gradient">
                      ${Number(activeTracking.summary.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-secondary text-[var(--royal)] shadow-soft">
                <Package className="h-10 w-10" />
              </div>
              <h2 className="mt-6 font-display text-3xl">Track Any Coast &amp; Peak Order</h2>
              <p className="mt-2 font-serif text-muted-foreground max-w-md mx-auto">
                Enter your order confirmation number above to follow the 3 stages: Order Placed, Preparing Order, and Order Sent.
              </p>
              {!isAuthenticated && (
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-widest text-[var(--royal)] hover:underline"
                  >
                    Log in to view all your commissioned pieces &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

export { TrackPage };
