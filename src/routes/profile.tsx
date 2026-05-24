import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Package, Heart, MapPin, LogOut, Pencil, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Coast & Peak Studio" }] }),
  component: ProfilePage,
});

type Address = {
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

const DEFAULT_ADDRESS: Address = {
  label: "Home",
  line1: "12, Lavender Lane",
  city: "Bangalore",
  state: "Karnataka",
  zip: "560001",
  country: "India",
};

function ProfilePage() {
  const [address, setAddress] = useState<Address>(DEFAULT_ADDRESS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Address>(DEFAULT_ADDRESS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cp-address");
      if (stored) {
        const parsed = JSON.parse(stored) as Address;
        setAddress(parsed); setDraft(parsed);
      }
    } catch {}
  }, []);

  const save = () => {
    setAddress(draft);
    try { localStorage.setItem("cp-address", JSON.stringify(draft)); } catch {}
    setEditing(false);
    toast.success("Address updated");
  };

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-12 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--royal)] to-[var(--wine)] text-white shadow-luxe depth-3d [transform:perspective(400px)_rotateX(8deg)]">
              <span className="font-display text-3xl">A</span>
            </div>
            <div>
              <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">Coast &amp; Peak Collector</p>
              <h1 className="mt-1 font-display text-4xl md:text-5xl">Hello, Aanya</h1>
              <p className="font-serif text-muted-foreground">aanya@example.com</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-3 md:px-12">
          {/* Address editor (spans 2) */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d md:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[var(--royal)]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-2xl">Shipping address</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Where pieces are sent</p>
                </div>
              </div>
              {!editing ? (
                <button onClick={() => { setDraft(address); setEditing(true); }} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                  <button onClick={save} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                    <Check className="h-3.5 w-3.5" /> Save
                  </button>
                </div>
              )}
            </div>

            {!editing ? (
              <div className="font-serif text-base leading-relaxed text-foreground/85">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--royal)]">{address.label}</p>
                <p className="mt-2">{address.line1}</p>
                <p>{address.city}, {address.state} {address.zip}</p>
                <p>{address.country}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Label" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
                <Field label="Street address" value={draft.line1} onChange={(v) => setDraft({ ...draft, line1: v })} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City" value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} />
                  <Field label="State" value={draft.state} onChange={(v) => setDraft({ ...draft, state: v })} />
                  <Field label="ZIP" value={draft.zip} onChange={(v) => setDraft({ ...draft, zip: v })} />
                </div>
                <Field label="Country" value={draft.country} onChange={(v) => setDraft({ ...draft, country: v })} />
              </div>
            )}
          </div>

          <Card icon={Package} title="Orders" subtitle="3 active · 12 lifetime" to="/track" />
          <Card icon={Heart} title="Wishlist" subtitle="Saved pieces" to="/wishlist" />
          <Card icon={User} title="Account details" subtitle="Name, email, preferences" to="/profile" />
          <Card icon={LogOut} title="Sign out" subtitle="See you soon" to="/login" />
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-[var(--royal)]"
      />
    </label>
  );
}

function Card({ icon: Icon, title, subtitle, to }: { icon: typeof User; title: string; subtitle: string; to: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-border bg-card p-6 shadow-soft depth-3d transition-all duration-300 ease-luxe magnetic-hover">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-[var(--royal)] transition-colors group-hover:bg-gradient-to-br group-hover:from-[var(--royal)] group-hover:to-[var(--wine)] group-hover:text-white">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </Link>
  );
}
