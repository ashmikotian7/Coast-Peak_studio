import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Search,
  RotateCcw,
  Truck,
  ArrowLeft,
  Package,
  ChevronDown,
  DollarSign,
  User,
  ShoppingBag,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import {
  fetchAllOrdersAPI,
  updateOrderStatusAPI,
  type OrderRecord,
} from "@/lib/orders-api";
import { getFallbackImage } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Order Registry — Coast & Peak Studio" },
      { name: "description", content: "Manage and fulfill customer orders at Coast & Peak Studio." },
    ],
  }),
  component: OrdersPage,
});

// The 3 required order stages
export const ORDER_STAGES = [
  { value: "placed", label: "Order Placed" },
  { value: "preparing", label: "Preparing Order" },
  { value: "dispatched", label: "Order Sent" },
] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  placed: {
    label: "Order Placed",
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-200",
  },
  preparing: {
    label: "Preparing Order",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  crafting: {
    label: "Preparing Order",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  packed: {
    label: "Preparing Order",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  shipped: {
    label: "Order Sent",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  sent: {
    label: "Order Sent",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  dispatched: {
    label: "Order Sent",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
};

function normalizeStage(rawStatus: string): "placed" | "preparing" | "dispatched" {
  const s = (rawStatus || "").toLowerCase().trim();
  if (s === "preparing" || s === "crafting" || s === "packed") return "preparing";
  if (s === "shipped" || s === "sent" || s === "dispatched" || s === "delivered") return "dispatched";
  return "placed";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrdersAPI();
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderNumber: string, newStatus: string) => {
    setUpdatingOrderId(orderNumber);
    try {
      const updatedData = await updateOrderStatusAPI(orderNumber, newStatus);
      const stageLabel =
        updatedData.current_status_display ||
        ORDER_STAGES.find((s) => s.value === newStatus)?.label ||
        newStatus;
      toast.success(`Order #${orderNumber} updated to "${stageLabel}"`);
      // Update order state directly from API response
      setOrders((prev) =>
        prev.map((o) =>
          o.order_number === orderNumber
            ? {
                ...o,
                status: updatedData.current_status,
                status_display: stageLabel,
                updated_at: updatedData.updated_at || new Date().toISOString(),
              }
            : o
        )
      );
    } catch (err: any) {
      toast.error("Status update failed", { description: err.message });
      await loadOrders();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Stats
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
    [orders]
  );
  const sentCount = useMemo(
    () => orders.filter((o) => normalizeStage(o.status) === "dispatched").length,
    [orders]
  );
  const preparingCount = useMemo(
    () => orders.filter((o) => normalizeStage(o.status) === "preparing").length,
    [orders]
  );
  const placedCount = useMemo(
    () => orders.filter((o) => normalizeStage(o.status) === "placed").length,
    [orders]
  );

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status Filter
      if (statusFilter !== "all" && normalizeStage(o.status) !== statusFilter) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNumber = o.order_number?.toLowerCase().includes(query);
        const customerName = (
          o.customer_name || `${o.first_name || ""} ${o.last_name || ""}`
        ).toLowerCase();
        const matchesName = customerName.includes(query);
        const matchesEmail = o.email?.toLowerCase().includes(query);
        const matchesAddress =
          (o.street_address || "").toLowerCase().includes(query) ||
          (o.city || "").toLowerCase().includes(query);
        const matchesProduct = o.items?.some((p) =>
          p.product_name?.toLowerCase().includes(query)
        );
        return (
          matchesNumber ||
          matchesName ||
          matchesEmail ||
          matchesAddress ||
          matchesProduct
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <SiteLayout>
      {/* Header Banner */}
      <section className="bg-lavender-gradient pt-32 pb-10 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 font-serif text-xs uppercase tracking-[0.2em] text-[var(--royal)] hover:underline mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
              <h1 className="font-display text-4xl md:text-6xl">Order Registry</h1>
              <p className="mt-2 max-w-xl font-serif text-muted-foreground">
                Manage client orders, review pieces, update fulfillment, and track customer shipments.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  loadOrders();
                  toast.success("Orders refreshed from database");
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-soft"
              >
                <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-105"
              >
                Atelier Catalog
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Orders" value={orders.length} icon={ClipboardList} />
            <StatCard
              label="Gross Value"
              value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={DollarSign}
            />
            <StatCard label="Preparing Order" value={preparingCount} icon={Package} />
            <StatCard label="Order Sent" value={sentCount} icon={Truck} />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          {/* Controls Bar: Search & Status Filter Chips */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Order #, Customer, Address, or Piece…"
                className="w-full rounded-full border border-border bg-card pl-11 pr-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--royal)] shadow-sm"
              />
            </div>

            {/* Status Tabs: 3 stages only */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 md:pb-0">
              <StatusChip
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                All ({orders.length})
              </StatusChip>
              <StatusChip
                active={statusFilter === "placed"}
                onClick={() => setStatusFilter("placed")}
              >
                Order Placed ({placedCount})
              </StatusChip>
              <StatusChip
                active={statusFilter === "preparing"}
                onClick={() => setStatusFilter("preparing")}
              >
                Preparing Order ({preparingCount})
              </StatusChip>
              <StatusChip
                active={statusFilter === "dispatched"}
                onClick={() => setStatusFilter("dispatched")}
              >
                Order Sent ({sentCount})
              </StatusChip>
            </div>
          </div>

          {/* Orders List / Cards */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-secondary text-[var(--royal)]">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-2xl">Reading order ledger…</h3>
              <p className="font-serif text-sm text-muted-foreground">Fetching records from studio database</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-16 text-center shadow-soft">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-2xl">No orders found</h3>
              <p className="mt-1 font-serif text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "Try resetting your search filters or status criteria."
                  : "Customer purchases will automatically populate here once orders are placed."}
              </p>
              {(searchQuery || statusFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs uppercase tracking-wider hover:bg-secondary"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const currentStage = normalizeStage(order.status);
                const statusStyle =
                  STATUS_CONFIG[currentStage] || STATUS_CONFIG.placed;
                const isUpdating = updatingOrderId === order.order_number;

                return (
                  <div
                    key={order.id}
                    className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-all duration-300 hover:shadow-luxe"
                  >
                    {/* Order Card Header */}
                    <div className="flex flex-col gap-3 border-b border-border bg-secondary/30 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-mono text-sm sm:text-base font-bold text-[var(--royal)]">
                            Order #{order.order_number}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {order.status_display || statusStyle.label}
                          </span>
                        </div>
                        <p className="mt-1 font-serif text-xs text-muted-foreground">
                          Placed on{" "}
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground block">
                          Total Amount ({order.total_items || order.items?.length || 0}{" "}
                          {(order.total_items || order.items?.length || 0) === 1 ? "item" : "items"})
                        </span>
                        <p className="font-display text-xl sm:text-2xl text-gold-gradient">
                          ${Number(order.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Order Body: Customer Info & Products with Controls Beside */}
                    <div className="grid gap-6 p-4 sm:p-6 md:grid-cols-12">
                      {/* Customer Info (4 Cols) */}
                      <div className="border-b border-border pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6 md:col-span-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h4 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                            Customer Details
                          </h4>
                        </div>
                        <div className="font-serif text-sm space-y-1">
                          <p className="font-semibold text-foreground">
                            {order.customer_name?.trim() ||
                              `${order.first_name || ""} ${order.last_name || ""}`.trim() ||
                              "Collector"}
                          </p>
                          {order.email && (
                            <p className="text-muted-foreground break-all">{order.email}</p>
                          )}
                          {order.phone && (
                            <p className="font-mono text-xs text-muted-foreground">
                              {order.phone}
                            </p>
                          )}
                          {(order.street_address || order.city) && (
                            <div className="mt-2 text-xs text-muted-foreground pt-2 border-t border-border/50 space-y-0.5">
                              {order.street_address && <p>{order.street_address}</p>}
                              <p>
                                {[order.city, order.state, order.zip_code]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          )}
                          {order.payment_method && (
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground pt-1">
                              Payment: <span className="font-semibold capitalize">{order.payment_method}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Products Section (8 Cols): Track Order and Status Dropdown placed BESIDE Products */}
                      <div className="md:col-span-8 flex flex-col justify-between">
                        {/* Products Header with Dropdown and Track Order BESIDE */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4 text-[var(--royal)]" />
                            <h4 className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">
                              Products ({order.items?.length || 0})
                            </h4>
                          </div>

                          {/* Controls right beside the products */}
                          <div className="flex items-center gap-2.5">
                            {/* Status Dropdown */}
                            <div className="relative inline-flex items-center">
                              <select
                                value={currentStage}
                                disabled={isUpdating}
                                onChange={(e) =>
                                  handleStatusChange(order.order_number, e.target.value)
                                }
                                className="rounded-full border border-border bg-background px-3 py-1.5 pr-7 text-xs font-medium outline-none transition-colors hover:border-[var(--royal)] focus:border-[var(--royal)] disabled:opacity-50 shadow-sm cursor-pointer"
                              >
                                <option value="placed">Order Placed</option>
                                <option value="preparing">Preparing Order</option>
                                <option value="dispatched">Order Sent</option>
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </div>
                        </div>

                        {/* Product items list */}
                        <div className="space-y-2.5">
                          {order.items?.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-2.5 sm:p-3"
                            >
                              <img
                                src={p.image || getFallbackImage()}
                                alt={p.product_name}
                                className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover border border-border shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-display text-sm truncate text-foreground">
                                  {p.product_name}
                                </h5>
                                <p className="font-serif text-xs text-muted-foreground">
                                  Qty: {p.quantity} × ${Number(p.unit_price).toFixed(2)}
                                </p>
                              </div>
                              <span className="font-display text-base text-foreground shrink-0">
                                ${Number(p.item_total).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-[var(--royal)] opacity-80" />
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

function StatusChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-[var(--royal)] text-white shadow-soft"
          : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
