import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { products as seedProducts, type Product } from "@/lib/products";

type CatalogCtx = {
  products: Product[];
  upsert: (p: Product) => void;
  remove: (id: string) => void;
  reset: () => void;
};

const Ctx = createContext<CatalogCtx | null>(null);
const KEY = "cp-catalog";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Product[]>(seedProducts);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setList(JSON.parse(raw) as Product[]);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  }, [list]);

  const value = useMemo<CatalogCtx>(() => ({
    products: list,
    upsert: (p) =>
      setList((prev) => {
        const i = prev.findIndex((x) => x.id === p.id);
        if (i === -1) return [p, ...prev];
        const copy = [...prev];
        copy[i] = p;
        return copy;
      }),
    remove: (id) => setList((prev) => prev.filter((p) => p.id !== id)),
    reset: () => setList(seedProducts),
  }), [list]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
}
