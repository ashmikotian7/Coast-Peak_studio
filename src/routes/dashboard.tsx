import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw, X, Check, Package } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useCatalog } from "@/hooks/use-catalog";
import type { Product } from "@/lib/products";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Seller Dashboard — Coast & Peak Studio" },
      { name: "description", content: "Manage your Coast & Peak Studio catalog: add, edit and remove pieces shown to customers." },
    ],
  }),
  component: DashboardPage,
});

type Draft = {
  id: string;
  name: string;
  price: string;
  image: string;
  category: Product["category"];
  tag: "" | "new" | "bestseller" | "limited";
  description: string;
  stock: string;
};

const empty: Draft = {
  id: "",
  name: "",
  price: "",
  image: "",
  category: "rings",
  tag: "",
  description: "",
  stock: "0",
};

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    name: p.name,
    price: String(p.price),
    image: p.image,
    category: p.category,
    tag: (p.tag ?? "") as Draft["tag"],
    description: p.description,
    stock: String(p.stock),
  };
}

function DashboardPage() {
  const { products, upsert, remove, reset } = useCatalog();
  const [editing, setEditing] = useState<Draft | null>(null);
  const isNew = editing?.id === "";

  const startNew = () => setEditing({ ...empty });
  const startEdit = (p: Product) => setEditing(toDraft(p));

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name is required");
    const price = Number(editing.price);
    const stock = Number(editing.stock);
    if (Number.isNaN(price) || price < 0) return toast.error("Price must be a number");
    if (Number.isNaN(stock) || stock < 0) return toast.error("Stock must be a number");
    const id = editing.id || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    const product: Product = {
      id,
      name: editing.name.trim(),
      price,
      image: editing.image || "https://placehold.co/800x1000/EFE6F5/3B1E5E?text=Piece",
      category: editing.category,
      tag: editing.tag === "" ? undefined : editing.tag,
      description: editing.description.trim(),
      stock,
    };
    upsert(product);
    toast.success(isNew ? "Piece added" : "Piece updated");
    setEditing(null);
  };

  return (
    <SiteLayout>
      <section className="bg-lavender-gradient pt-32 pb-10 md:pt-40">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="font-serif text-xs uppercase tracking-[0.3em] text-[var(--royal)]">Seller dashboard</p>
              <h1 className="mt-2 font-display text-4xl md:text-6xl">Manage your atelier</h1>
              <p className="mt-3 max-w-xl font-serif text-muted-foreground">
                Add, edit and remove pieces. Changes appear instantly in the shop your customers see.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { reset(); toast.success("Catalog reset"); }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary"
              >
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
              <button
                onClick={startNew}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft"
              >
                <Plus className="h-4 w-4" /> Add piece
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Pieces live" value={products.length} />
            <Stat label="In stock" value={products.reduce((n, p) => n + p.stock, 0)} />
            <Stat label="Bestsellers" value={products.filter((p) => p.tag === "bestseller").length} />
            <Stat label="Limited" value={products.filter((p) => p.tag === "limited").length} />
          </div>
        </div>
      </section>

      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <div className="grid grid-cols-[64px_1fr_120px_120px_120px_100px] items-center gap-4 border-b border-border px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span></span>
              <span>Piece</span>
              <span>Category</span>
              <span>Price</span>
              <span>Stock</span>
              <span className="text-right">Actions</span>
            </div>
            {products.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
                <Package className="h-8 w-8 text-muted-foreground" />
                <p className="font-serif text-muted-foreground">No pieces yet. Add your first.</p>
              </div>
            )}
            {products.map((p) => (
              <div key={p.id} className="grid grid-cols-[64px_1fr_120px_120px_120px_100px] items-center gap-4 border-b border-border px-5 py-3 last:border-0">
                <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="truncate font-serif text-base">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.description}</p>
                </div>
                <span className="text-sm capitalize">{p.category}</span>
                <span className="font-display text-lg">${p.price}</span>
                <span className="text-sm">{p.stock}</span>
                <div className="flex justify-end gap-2">
                  <button onClick={() => startEdit(p)} aria-label="Edit" className="rounded-full border border-border p-2 hover:bg-secondary">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { remove(p.id); toast("Piece removed"); }}
                    aria-label="Delete"
                    className="rounded-full border border-border p-2 text-[var(--wine)] hover:bg-secondary"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Editor drawer */}
      {editing && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-popover p-6 shadow-luxe md:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{isNew ? "New piece" : "Edit piece"}</p>
                <h3 className="font-display text-3xl">{isNew ? "Add to catalog" : editing.name || "Edit"}</h3>
              </div>
              <button onClick={() => setEditing(null)} className="rounded-full border border-border p-2" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <Field label="Price (USD)" value={editing.price} onChange={(v) => setEditing({ ...editing, price: v })} />
              <Field label="Image URL" value={editing.image} onChange={(v) => setEditing({ ...editing, image: v })} full />
              <Select
                label="Category"
                value={editing.category}
                onChange={(v) => setEditing({ ...editing, category: v as Product["category"] })}
                options={["earrings", "necklaces", "rings", "bracelets"]}
              />
              <Select
                label="Tag"
                value={editing.tag}
                onChange={(v) => setEditing({ ...editing, tag: v as Draft["tag"] })}
                options={["", "new", "bestseller", "limited"]}
                renderOption={(v) => (v === "" ? "— none —" : v)}
              />
              <Field label="Stock" value={editing.stock} onChange={(v) => setEditing({ ...editing, stock: v })} />
              <div className="md:col-span-2">
                <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Description</span>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[var(--royal)]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
                Cancel
              </button>
              <button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                <Check className="h-4 w-4" /> Save piece
              </button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--royal)]"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, renderOption }: { label: string; value: string; onChange: (v: string) => void; options: string[]; renderOption?: (v: string) => string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-[var(--royal)]"
      >
        {options.map((o) => (
          <option key={o} value={o}>{renderOption ? renderOption(o) : o}</option>
        ))}
      </select>
    </label>
  );
}
