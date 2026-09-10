import { createFileRoute, Link } from "@tanstack/react-router";
import { User as UserIcon, Package, Heart, MapPin, LogOut, Pencil, Check, X, Lock, ArrowRight, Shield, Mail, Phone, UserCheck, Truck, ShoppingBag, ChevronRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useAuth } from "@/contexts/auth-context";
import { fetchOrderHistoryAPI, type OrderHistoryRecord } from "@/lib/orders-api";
import { getFallbackImage } from "@/lib/products";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Coast & Peak Studio" }] }),
  component: ProfilePage,
});

type PersonalDraft = {
  full_name: string;
  email: string;
  phone_number: string;
};

type AddressDraft = {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

export default function ProfilePage() {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  
  // Personal Info Edit State
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [personalDraft, setPersonalDraft] = useState<PersonalDraft>({
    full_name: "",
    email: "",
    phone_number: "",
  });

  // Shipping Address Edit State
  const [editingAddress, setEditingAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState<AddressDraft>({
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    country: "India",
  });

  // Order History State
  const [orders, setOrders] = useState<OrderHistoryRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const loadOrderHistory = async () => {
    if (!user?.email) return;
    setLoadingOrders(true);
    try {
      const res = await fetchOrderHistoryAPI({ email: user.email });
      setOrders(res.orders || []);
    } catch (err) {
      console.warn("Could not fetch order history:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      setPersonalDraft({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
      });
      setAddressDraft({
        street_address: user.street_address || "",
        city: user.city || "",
        state: user.state || "",
        zip_code: user.zip_code || "",
        country: user.country || "India",
      });
      loadOrderHistory();
    }
  }, [user]);

  const savePersonal = async () => {
    if (!personalDraft.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!personalDraft.email.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      setSavingPersonal(true);
      await updateProfile({
        full_name: personalDraft.full_name,
        email: personalDraft.email,
        phone_number: personalDraft.phone_number,
      });
      setEditingPersonal(false);
      toast.success("Personal details updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update personal details");
    } finally {
      setSavingPersonal(false);
    }
  };

  const saveAddress = async () => {
    try {
      setSavingAddress(true);
      await updateProfile({
        street_address: addressDraft.street_address,
        city: addressDraft.city,
        state: addressDraft.state,
        zip_code: addressDraft.zip_code,
        country: addressDraft.country,
      });
      setEditingAddress(false);
      toast.success("Shipping address updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update shipping address");
    } finally {
      setSavingAddress(false);
    }
  };

  // IF USER IS NOT LOGGED IN -> SHOW LOGIN PROMPT
  if (!isAuthenticated || !user) {
    return (
      <SiteLayout>
        <div className="fixed inset-0 -z-10 bg-lavender-gradient" />

        <section className="min-h-screen pt-32 pb-12 md:pt-40">
          <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-card border border-border text-[var(--royal)] shadow-soft depth-3d">
              <Lock className="h-9 w-9" />
            </div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">
              Collector Access Restricted
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">Sign in to view your profile</h1>
            <p className="mt-4 font-serif text-lg text-muted-foreground max-w-xl mx-auto">
              You must be signed in to access your orders, saved treasures, shipping vault, and profile settings.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-luxe depth-3d transition-transform hover:scale-105"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-border bg-card px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground shadow-soft depth-3d hover:bg-secondary"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  // IF USER IS LOGGED IN -> SHOW LIVE PROFILE SESSION
  const initial = user.full_name ? user.full_name.charAt(0).toUpperCase() : "U";
  const hasAddress = Boolean(user.street_address || user.city || user.state || user.zip_code);

  return (
    <SiteLayout>
      <div className="fixed inset-0 -z-10 bg-lavender-gradient" />

      {/* Header Banner */}
      <section className="pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left md:justify-between">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--royal)] to-[var(--wine)] text-white shadow-luxe depth-3d [transform:perspective(400px)_rotateX(8deg)]">
                <span className="font-display text-3xl">{initial}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <span className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">
                    {user.is_admin ? "Administrator" : "Coast & Peak Collector"}
                  </span>
                  {user.is_admin && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                </div>
                <h1 className="mt-1 font-display text-4xl md:text-5xl">{user.full_name}</h1>
                <p className="font-serif text-muted-foreground">{user.email}</p>
                {user.phone_number && (
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{user.phone_number}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50/50 px-6 py-3 text-xs uppercase tracking-[0.2em] text-rose-700 hover:bg-rose-100 transition-colors shadow-soft"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 md:px-12">
          
          {/* Personal Information Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[var(--royal)]">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl">Personal Information</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Name, Email & Contact
                  </p>
                </div>
              </div>
              {!editingPersonal ? (
                <button
                  onClick={() => {
                    setPersonalDraft({
                      full_name: user.full_name || "",
                      email: user.email || "",
                      phone_number: user.phone_number || "",
                    });
                    setEditingPersonal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPersonal(false)}
                    disabled={savingPersonal}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={savePersonal}
                    disabled={savingPersonal}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> {savingPersonal ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {!editingPersonal ? (
              <div className="font-serif text-base leading-relaxed text-foreground/85 space-y-2">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground block">Full Name</span>
                  <p className="font-medium text-foreground">{user.full_name || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground block">Email Address</span>
                  <p className="font-medium text-foreground">{user.email || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground block">Phone Number</span>
                  <p className="font-mono text-sm text-foreground">{user.phone_number || "Not provided"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Field
                  label="Full Name"
                  value={personalDraft.full_name}
                  onChange={(v) => setPersonalDraft({ ...personalDraft, full_name: v })}
                />
                <Field
                  label="Email Address"
                  type="email"
                  value={personalDraft.email}
                  onChange={(v) => setPersonalDraft({ ...personalDraft, email: v })}
                />
                <Field
                  label="Phone Number"
                  type="tel"
                  value={personalDraft.phone_number}
                  onChange={(v) => setPersonalDraft({ ...personalDraft, phone_number: v })}
                />
              </div>
            )}
          </div>

          {/* Shipping Address Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[var(--royal)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl">Shipping Address</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Stored delivery vault
                  </p>
                </div>
              </div>
              {!editingAddress ? (
                <button
                  onClick={() => {
                    setAddressDraft({
                      street_address: user.street_address || "",
                      city: user.city || "",
                      state: user.state || "",
                      zip_code: user.zip_code || "",
                      country: user.country || "India",
                    });
                    setEditingAddress(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAddress(false)}
                    disabled={savingAddress}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button
                    onClick={saveAddress}
                    disabled={savingAddress}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> {savingAddress ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {!editingAddress ? (
              <div className="font-serif text-base leading-relaxed text-foreground/85">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--royal)]">
                  Delivery Location
                </p>
                {hasAddress ? (
                  <>
                    <p className="mt-2">{user.street_address}</p>
                    <p>
                      {[user.city, user.state, user.zip_code].filter(Boolean).join(", ")}
                    </p>
                    <p>{user.country || "India"}</p>
                  </>
                ) : (
                  <p className="mt-2 text-muted-foreground italic">
                    No delivery address saved yet. Click Edit to add your address.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Field
                  label="Street Address"
                  value={addressDraft.street_address}
                  onChange={(v) => setAddressDraft({ ...addressDraft, street_address: v })}
                />
                <div className="grid grid-cols-3 gap-3">
                  <Field
                    label="City"
                    value={addressDraft.city}
                    onChange={(v) => setAddressDraft({ ...addressDraft, city: v })}
                  />
                  <Field
                    label="State"
                    value={addressDraft.state}
                    onChange={(v) => setAddressDraft({ ...addressDraft, state: v })}
                  />
                  <Field
                    label="ZIP Code"
                    value={addressDraft.zip_code}
                    onChange={(v) => setAddressDraft({ ...addressDraft, zip_code: v })}
                  />
                </div>
                <Field
                  label="Country"
                  value={addressDraft.country}
                  onChange={(v) => setAddressDraft({ ...addressDraft, country: v })}
                />
              </div>
            )}
          </div>

          {/* Order History Section */}
          <div className="md:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d mt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[var(--royal)]">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl">Atelier Order History</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Your personal heirloom commissions ({orders.length})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadOrderHistory}
                  disabled={loadingOrders}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs hover:bg-secondary transition-colors"
                >
                  <RotateCcw className={`h-3 w-3 ${loadingOrders ? "animate-spin" : ""}`} /> Refresh
                </button>
                <Link
                  to="/track"
                  className="inline-flex items-center gap-1 text-xs font-serif uppercase tracking-widest text-[var(--royal)] hover:underline"
                >
                  Full Tracking Ledger <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-12 text-center">
                <Package className="mx-auto h-8 w-8 text-[var(--royal)] animate-pulse" />
                <p className="mt-2 font-serif text-sm text-muted-foreground">Consulting order archive…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center">
                <p className="font-serif text-muted-foreground">
                  No orders found under this account yet.
                </p>
                <Link
                  to="/shop"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Explore Atelier Collections &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="rounded-2xl border border-border/70 bg-background/60 p-4 transition-all hover:border-[var(--royal)]/40 hover:shadow-soft"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-[var(--royal)]">
                            Order #{ord.order_number}
                          </span>
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            {ord.status_display || ord.status}
                          </span>
                        </div>
                        <p className="text-xs font-serif text-muted-foreground mt-0.5">
                          Placed on{" "}
                          {new Date(ord.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-display text-xl text-gold-gradient">
                          ${Number(ord.total_amount).toFixed(2)}
                        </span>
                        <Link
                          to="/track"
                          search={{ order: ord.order_number }}
                          className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3.5 py-1 text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          <Truck className="h-3 w-3" /> Track
                        </Link>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {ord.items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-xs font-serif">
                          <img
                            src={item.image || getFallbackImage()}
                            alt={item.product_name}
                            className="h-10 w-10 rounded-lg object-cover border border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-sm truncate text-foreground">{item.product_name}</p>
                            <p className="text-muted-foreground">Qty: {item.quantity} × ${Number(item.unit_price).toFixed(2)}</p>
                          </div>
                          <span className="font-display text-sm text-foreground">
                            ${Number(item.item_total).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Address summary badge */}
                    {ord.street_address && (
                      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3 text-[var(--royal)]" />
                        <span>
                          Shipped to: {ord.street_address}, {ord.city}, {ord.state} {ord.zip_code}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Cards */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
            <Card icon={Package} title="Order History" subtitle="Track active & past shipments" to="/track" />
            <Card icon={Heart} title="Wishlist" subtitle="Saved luxury pieces" to="/wishlist" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--royal)]"
      />
    </label>
  );
}

function Card({
  icon: Icon,
  title,
  subtitle,
  to,
}: {
  icon: typeof UserIcon;
  title: string;
  subtitle: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d transition-all duration-300 ease-luxe magnetic-hover"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-[var(--royal)] transition-colors group-hover:bg-gradient-to-br group-hover:from-[var(--royal)] group-hover:to-[var(--wine)] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );
}

export { ProfilePage };