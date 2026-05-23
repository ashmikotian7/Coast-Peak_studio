import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/products";

type CartItem = { product: Product; qty: number };

type StoreCtx = {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  toggleWishlist: (id: string) => void;
  isWished: (id: string) => boolean;
  cartCount: number;
  cartTotal: number;
};

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem("sk-cart");
      const w = localStorage.getItem("sk-wish");
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("sk-cart", JSON.stringify(cart)); } catch {}
  }, [cart]);
  useEffect(() => {
    try { localStorage.setItem("sk-wish", JSON.stringify(wishlist)); } catch {}
  }, [wishlist]);

  const value = useMemo<StoreCtx>(() => ({
    cart,
    wishlist,
    addToCart: (p, qty = 1) =>
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === p.id);
        if (existing) return prev.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + qty } : i));
        return [...prev, { product: p, qty }];
      }),
    removeFromCart: (id) => setCart((prev) => prev.filter((i) => i.product.id !== id)),
    updateQty: (id, qty) =>
      setCart((prev) =>
        qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, qty } : i)),
      ),
    toggleWishlist: (id) =>
      setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    isWished: (id) => wishlist.includes(id),
    cartCount: cart.reduce((n, i) => n + i.qty, 0),
    cartTotal: cart.reduce((n, i) => n + i.qty * i.product.price, 0),
  }), [cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
