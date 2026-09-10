import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchProductsFromAPI, deleteProductFromAPI, type Product } from "@/lib/products";

type CatalogCtx = {
  products: Product[];
  isLoading: boolean;
  upsert: (p: Product) => void;
  remove: (id: string) => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const apiItems = await fetchProductsFromAPI();
      setList(apiItems);
    } catch (e) {
      console.error("Failed to load products from database:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear any obsolete localStorage mock cache so DB is the sole truth
    try {
      localStorage.removeItem("cp-catalog");
    } catch {}

    refresh();
  }, []);

  const remove = async (id: string) => {
    await deleteProductFromAPI(id);
    setList((prev) => prev.filter((p) => p.id !== id));
  };

  const value = useMemo<CatalogCtx>(() => ({
    products: list,
    isLoading,
    upsert: (p) =>
      setList((prev) => {
        const i = prev.findIndex((x) => x.id === p.id);
        if (i === -1) return [p, ...prev];
        const copy = [...prev];
        copy[i] = p;
        return copy;
      }),
    remove,
    reset: refresh,
    refresh,
  }), [list, isLoading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
