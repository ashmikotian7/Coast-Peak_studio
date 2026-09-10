import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Plus, Pencil, Trash2, RotateCcw, X, Check, Package, Upload, ImageOff, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { useCatalog } from "@/hooks/use-catalog";
import { saveProductToCatalog, updateProductInCatalog, type Product } from "@/lib/products";

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
  sku?: string;
  name: string;
  price: string;
  image: string; // base64 data URL (or existing URL when editing an older piece)
  imageFile?: File | null;
  category: Product["category"];
  tag: "" | "new" | "bestseller" | "limited" | "Sold Out";
  description: string;
  stock: string;
};

const empty: Draft = {
  id: "",
  sku: "",
  name: "",
  price: "",
  image: "",
  imageFile: null,
  category: "rings",
  tag: "",
  description: "",
  stock: "0",
};

const MAX_IMAGE_MB = 5;

function toDraft(p: Product): Draft {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    price: String(p.price),
    image: p.image,
    imageFile: null,
    category: p.category,
    tag: (p.tag ?? "") as Draft["tag"],
    description: p.description,
    stock: String(p.stock),
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function DashboardPage() {
  const { products, upsert, remove, reset } = useCatalog();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSaving, setIsSaving] = useState(false);
  const isNew = editing?.id === "";

  const startNew = () => {
    setEditing({ ...empty, imageFile: null });
    setStep(1);
  };
  
  const startEdit = (p: Product) => {
    setEditing(toDraft(p));
    setStep(1);
  };

  const closeEditor = () => {
    setEditing(null);
    setStep(1);
  };

  const handleNext = () => {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Please enter a name for the piece");
    const price = Number(editing.price);
    const stock = Number(editing.stock);
    if (editing.price.trim() === "" || Number.isNaN(price) || price < 0) {
      return toast.error("Please enter a valid price (USD)");
    }
    if (editing.stock.trim() === "" || Number.isNaN(stock) || stock < 0) {
      return toast.error("Please enter a valid stock quantity");
    }
    setStep(2);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setStep(1);
      return toast.error("Name is required");
    }
    const price = Number(editing.price);
    const stock = Number(editing.stock);
    if (editing.price.trim() === "" || Number.isNaN(price) || price < 0) {
      setStep(1);
      return toast.error("Price must be a valid number");
    }
    if (editing.stock.trim() === "" || Number.isNaN(stock) || stock < 0) {
      setStep(1);
      return toast.error("Stock must be a valid number");
    }
    if (!editing.image && !editing.imageFile) {
      return toast.error("Please upload an image for the piece");
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const newProduct = await saveProductToCatalog(
          {
            name: editing.name.trim(),
            price: editing.price.trim(),
            category: editing.category,
            tag: editing.tag || "— None —",
            stock: editing.stock.trim() || 0,
            description: editing.description.trim(),
          },
          editing.imageFile
        );
        upsert(newProduct);
        toast.success(
          newProduct.sku
            ? `Piece added to catalog! SKU: ${newProduct.sku}`
            : "Piece added to catalog!"
        );
      } else {
        const updated = await updateProductInCatalog(
          editing.id,
          {
            name: editing.name.trim(),
            price: editing.price.trim(),
            category: editing.category,
            tag: editing.tag || "— None —",
            stock: editing.stock.trim() || 0,
            description: editing.description.trim(),
          },
          editing.imageFile
        );
        upsert(updated);
        toast.success("Piece updated in database");
      }
      closeEditor();
    } catch (err) {
      toast.error("Failed to save product", {
        description: (err as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
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
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors shadow-soft"
              >
                <ClipboardList className="h-4 w-4 text-[var(--royal)]" /> Order List
              </Link>
              <button
                onClick={async () => {
                  await reset();
                  toast.success("Catalog synced with database");
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm hover:bg-secondary transition-colors shadow-soft"
              >
                <RotateCcw className="h-4 w-4" /> Sync DB
              </button>
              <button
                onClick={startNew}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-105"
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
                <p className="font-serif text-muted-foreground">No pieces in database yet. Add your first.</p>
              </div>
            )}
            {products.map((p) => (
              <div key={p.id} className="grid grid-cols-[64px_1fr_120px_120px_120px_100px] items-center gap-4 border-b border-border px-5 py-3 last:border-0">
                <img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-serif text-base">{p.name}</p>
                    {p.sku && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--royal)]">
                        {p.sku}
                      </span>
                    )}
                  </div>
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
                    onClick={async () => {
                      try {
                        await remove(p.id);
                        toast.success("Piece deleted from database");
                      } catch (err) {
                        toast.error("Failed to delete piece from database", {
                          description: (err as Error).message,
                        });
                      }
                    }}
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

      {/* Editor drawer / modal */}
      {editing && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center md:items-center">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity" onClick={closeEditor} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-popover p-6 shadow-luxe md:rounded-3xl border border-border">
            
            {/* Header */}
            <div className="mb-6 flex items-start justify-between border-b border-border/60 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--royal)] font-medium">
                  {isNew ? "New piece" : "Edit piece"}
                </p>
                <h3 className="mt-1 font-display text-2xl md:text-3xl font-semibold">
                  {isNew ? "Add to catalog" : editing.name || "Edit piece"}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full transition-colors ${step === 1 ? "bg-[var(--royal)]" : "bg-muted-foreground/30"}`} />
                  <span className={`h-2 w-2 rounded-full transition-colors ${step === 2 ? "bg-[var(--royal)]" : "bg-muted-foreground/30"}`} />
                  <span className="font-medium text-foreground">Step {step} of 2</span>
                </div>
                <button
                  onClick={closeEditor}
                  className="rounded-full border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Step 1: Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Field
                    label="Name"
                    value={editing.name}
                    placeholder="e.g. Celestial Diamond Ring"
                    onChange={(v) => setEditing({ ...editing, name: v })}
                  />
                  <Field
                    label="Price (USD)"
                    type="number"
                    value={editing.price}
                    placeholder="e.g. 350"
                    onChange={(v) => setEditing({ ...editing, price: v })}
                  />

                  <Select
                    label="Category"
                    value={editing.category}
                    onChange={(v) => setEditing({ ...editing, category: v as Product["category"] })}
                    options={["rings", "earrings", "necklaces", "bracelets"]}
                  />

                  <Select
                    label="Tag"
                    value={editing.tag}
                    onChange={(v) => setEditing({ ...editing, tag: v as Draft["tag"] })}
                    options={["", "new", "bestseller", "limited"]}
                    renderOption={(v) => (v === "" ? "— none —" : v.charAt(0).toUpperCase() + v.slice(1))}
                  />

                  <Field
                    label="Stock"
                    type="number"
                    value={editing.stock}
                    placeholder="0"
                    onChange={(v) => setEditing({ ...editing, stock: v })}
                  />

                  <div className="md:col-span-2">
                    <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Description</span>
                    <textarea
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      placeholder="Handcrafted in ethical gold with natural brilliant stones..."
                      rows={3}
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
                    />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90 transition-opacity"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Image Upload */}
            {step === 2 && (
              <div className="space-y-6">
                <ImageUpload
                  value={editing.image}
                  onChange={(v) => setEditing({ ...editing, image: v })}
                  onFileChange={(file) => setEditing({ ...editing, imageFile: file })}
                />

                <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isSaving}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeEditor}
                      disabled={isSaving}
                      className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {isSaving ? (
                        <span>Saving…</span>
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

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

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  renderOption,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  renderOption?: (v: string) => string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20 capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">
            {renderOption ? renderOption(o) : o}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImageUpload({
  value,
  onChange,
  onFileChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onFileChange?: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_MB}MB`);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
      onFileChange?.(file);
    } catch {
      setError("Could not read that image, please try again");
    }
  };

  return (
    <div className="space-y-2">
      <span className="block text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-medium">Image</span>

      {value ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-background/60 p-6 text-center shadow-soft">
          <div className="relative h-60 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-secondary shadow-soft">
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-secondary transition-colors"
            >
              <Upload className="h-3.5 w-3.5" /> Replace image
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                onFileChange?.(null);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-[var(--wine)] hover:bg-secondary transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition-all ${
            dragOver
              ? "border-[var(--royal)] bg-[var(--royal)]/5 shadow-soft scale-[1.01]"
              : "border-border bg-background hover:border-[var(--royal)]/60 hover:bg-secondary/40"
          }`}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-[var(--royal)] shadow-soft">
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="font-serif text-base text-foreground">
              Drag &amp; drop a photo here, or browse your files.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Supports JPG, PNG, WebP up to {MAX_IMAGE_MB}MB
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 border border-border shadow-soft"
          >
            <Upload className="h-3.5 w-3.5" /> Upload image
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="mt-2 text-xs text-[var(--wine)] font-medium">{error}</p>}
    </div>
  );
}