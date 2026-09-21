import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Lock, ShieldAlert, ArrowRight, Package } from "lucide-react";
import { SiteLayout } from "@/components/sk/SiteLayout";
import { collections, saveProductToCatalog, DEFAULT_CATEGORY_MAP } from "@/lib/products";
import { useCatalog } from "@/hooks/use-catalog";
import { useAuth } from "@/contexts/auth-context";

// Helper to render a select dropdown from collections
function CategorySelect({ value, onChange }: { value: string | number; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
    >
      {collections.map(col => {
        const catId = DEFAULT_CATEGORY_MAP[col.slug] ?? col.slug;
        return (
          <option key={col.slug} value={catId}>
            {col.name}
          </option>
        );
      })}
    </select>
  );
}

// Main component for the two‑step form
function AddProductPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { upsert } = useCatalog();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [category, setCategory] = useState<string | number>(DEFAULT_CATEGORY_MAP[collections[0].slug] || 1);
  const [tag, setTag] = useState(""); // empty = none
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canProceedStep1 =
    name.trim() !== "" &&
    priceUsd.trim() !== "" &&
    !isNaN(parseFloat(priceUsd)) &&
    stock.trim() !== "" &&
    !isNaN(parseInt(stock, 10));

  const handleSave = async () => {
    if (!canProceedStep1) {
      toast.error("Please fill all required fields correctly.");
      return;
    }
    if (!imageFile) {
      toast.error("Please add an image.");
      return;
    }
    setIsSaving(true);
    try {
      const newProduct = await saveProductToCatalog(
        {
          name: name.trim(),
          price: priceUsd.trim(),
          category: category,
          tag: tag || "— None —",
          stock: stock.trim() || 0,
          description: description.trim(),
        },
        imageFile
      );

      upsert(newProduct);
      toast.success("Product added successfully!");
      navigate({ to: "/shop" });
    } catch (e) {
      toast.error("Failed to add product.", { description: (e as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <SiteLayout>
        <div className="fixed inset-0 -z-10 bg-lavender-gradient" />
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Package className="h-8 w-8 text-[var(--royal)] animate-pulse" />
            <p className="font-serif text-sm text-muted-foreground">Verifying atelier clearance…</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

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
              Atelier Access Restricted
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">Sign in to Add Products</h1>
            <p className="mt-4 font-serif text-lg text-muted-foreground max-w-xl mx-auto">
              Adding new pieces to the boutique catalog requires an atelier administrator account.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-luxe depth-3d transition-transform hover:scale-105"
              >
                Sign In <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-border bg-card px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground shadow-soft depth-3d hover:bg-secondary"
              >
                Return to Atelier
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (!user.is_admin) {
    return (
      <SiteLayout>
        <div className="fixed inset-0 -z-10 bg-lavender-gradient" />
        <section className="min-h-screen pt-32 pb-12 md:pt-40">
          <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-600 shadow-soft depth-3d">
              <ShieldAlert className="h-9 w-9" />
            </div>
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-amber-700">
              Administrator Clearance Required
            </p>
            <h1 className="mt-3 font-display text-4xl md:text-5xl">Access Restricted</h1>
            <p className="mt-4 font-serif text-lg text-muted-foreground max-w-xl mx-auto">
              You are signed in as <strong>{user.full_name}</strong>. Only atelier administrators are authorized to add new heirloom pieces to the catalog.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/profile"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-luxe depth-3d transition-transform hover:scale-105"
              >
                View My Profile
              </Link>
              <Link
                to="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-full border border-border bg-card px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground shadow-soft depth-3d hover:bg-secondary"
              >
                Browse Shop
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
        <div className="mx-auto max-w-3xl px-6 md:px-12">
          <h1 className="text-center font-display text-4xl md:text-5xl mb-8">Add New Product</h1>

          {/* Step 1 – details */}
          {step === 1 && (
            <div className="glass rounded-3xl border border-border p-8 shadow-soft space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="priceUsd">
                  Price (USD)
                </label>
                <input
                  id="priceUsd"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="99999999.99"
                  placeholder="e.g. 150.00"
                  value={priceUsd}
                  onChange={e => setPriceUsd(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="category">
                  Category
                </label>
                <CategorySelect value={category} onChange={setCategory} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tag">
                  Tag
                </label>
                <select
                  id="tag"
                  value={tag}
                  onChange={e => setTag(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
                >
                  <option value="">— none —</option>
                  <option value="new">New</option>
                  <option value="bestseller">Bestseller</option>
                  <option value="limited">Limited</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="stock">
                  Stock
                </label>
                <input
                  id="stock"
                  type="number"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:border-[var(--royal)] focus:ring-2 focus:ring-[var(--royal)]/20"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next – Image
                </button>
              </div>
            </div>
          )}

          {/* Step 2 – image upload */}
          {step === 2 && (
            <div className="glass rounded-3xl border border-border p-8 shadow-soft space-y-6">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-[var(--royal)]"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = e => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files[0]) setImageFile(files[0]);
                  };
                  input.click();
                }}
              >
                {imageFile ? (
                  <div className="flex flex-col items-center">
                    <img src={URL.createObjectURL(imageFile)} alt="preview" className="max-h-48 mb-4 rounded" />
                    <span className="text-sm text-muted-foreground">{imageFile.name}</span>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Drag &amp; drop a photo here, or click to browse.</p>
                )}
              </div>

              <div className="flex justify-between space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-[var(--royal)] to-[var(--wine)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

export const Route = createFileRoute("/add-product")({
  component: AddProductPage,
});
