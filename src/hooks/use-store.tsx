import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import type { Product } from "@/lib/products";
import { getAccessToken, isAuthenticated as checkIsAuthenticated } from "@/lib/auth";
import {
  fetchCartAPI,
  addItemToCartAPI,
  updateCartItemQtyAPI,
  removeCartItemAPI,
  clearCartAPI,
  mergeCartAPI,
  normalizeCartProduct,
} from "@/lib/cart-api";
import {
  fetchWishlistAPI,
  toggleWishlistItemAPI,
  removeWishlistItemAPI,
  moveWishlistToCartAPI,
  mergeWishlistAPI,
  normalizeWishlistProduct,
} from "@/lib/wishlist-api";
import { toast } from "sonner";

export type CartItem = {
  id?: number; // Backend CartItem ID
  product: Product;
  qty: number;
  item_total?: number;
};

export type StoreCtx = {
  cart: CartItem[];
  wishlist: string[];
  wishlistProducts: Product[];
  isLoadingCart: boolean;
  isLoadingWishlist: boolean;
  addToCart: (p: Product, qty?: number) => Promise<boolean>;
  removeFromCart: (cartItemIdOrProductId: number | string) => Promise<void>;
  updateQty: (cartItemIdOrProductId: number | string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleWishlist: (productId: string, productObj?: Product) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<void>;
  moveWishlistToCart: (productId: string, qty?: number) => Promise<void>;
  isWished: (id: string) => boolean;
  cartCount: number;
  cartTotal: number;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
};

const StoreContext = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [authStatus, setAuthStatus] = useState<boolean>(false);

  // Fetch cart from server
  const refreshCart = useCallback(async () => {
    if (!checkIsAuthenticated()) return;
    setIsLoadingCart(true);
    try {
      const data = await fetchCartAPI();
      const mappedItems: CartItem[] = (data.items || []).map((item) => ({
        id: item.id,
        product: normalizeCartProduct(item.product),
        qty: item.quantity,
        item_total: item.item_total,
      }));
      setCart(mappedItems);
    } catch (err: any) {
      console.warn("Could not fetch cart from server:", err);
    } finally {
      setIsLoadingCart(false);
    }
  }, []);

  // Fetch wishlist from server
  const refreshWishlist = useCallback(async () => {
    if (!checkIsAuthenticated()) return;
    setIsLoadingWishlist(true);
    try {
      const data = await fetchWishlistAPI();
      setWishlist((data.product_ids || []).map(String));
      const products: Product[] = (data.items || []).map((item) =>
        normalizeWishlistProduct(item.product)
      );
      setWishlistProducts(products);
    } catch (err: any) {
      console.warn("Could not fetch wishlist from server:", err);
    } finally {
      setIsLoadingWishlist(false);
    }
  }, []);

  // Initialize or handle Auth changes (Guest sync)
  useEffect(() => {
    const isAuthed = checkIsAuthenticated();
    setAuthStatus(isAuthed);

    async function initializeStore() {
      if (isAuthed) {
        // Check for local guest items to merge
        let localCart: CartItem[] = [];
        let localWish: string[] = [];
        try {
          const c = localStorage.getItem("sk-cart");
          const w = localStorage.getItem("sk-wish");
          if (c) localCart = JSON.parse(c);
          if (w) localWish = JSON.parse(w);
        } catch {}

        // Merge cart if guest items exist
        if (localCart.length > 0) {
          try {
            await mergeCartAPI(
              localCart.map((i) => ({
                product_id: String(i.product.id),
                quantity: i.qty,
              }))
            );
            localStorage.removeItem("sk-cart");
          } catch (e) {
            console.warn("Error merging guest cart:", e);
          }
        }

        // Merge wishlist if guest items exist
        if (localWish.length > 0) {
          try {
            await mergeWishlistAPI(localWish);
            localStorage.removeItem("sk-wish");
          } catch (e) {
            console.warn("Error merging guest wishlist:", e);
          }
        }

        // Refresh latest server state
        await Promise.all([refreshCart(), refreshWishlist()]);
      } else {
        // Guest mode: load from localStorage
        try {
          const c = localStorage.getItem("sk-cart");
          const w = localStorage.getItem("sk-wish");
          if (c) setCart(JSON.parse(c));
          else setCart([]);
          if (w) setWishlist(JSON.parse(w));
          else setWishlist([]);
        } catch {
          setCart([]);
          setWishlist([]);
        }
        setWishlistProducts([]);
      }
    }

    initializeStore();

    // Listen to storage events (e.g., login in another tab or token changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "access_token") {
        const nowAuthed = checkIsAuthenticated();
        setAuthStatus(nowAuthed);
        initializeStore();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshCart, refreshWishlist]);

  // Persist guest data to localStorage when unauthenticated
  useEffect(() => {
    if (!checkIsAuthenticated()) {
      try {
        localStorage.setItem("sk-cart", JSON.stringify(cart));
      } catch {}
    }
  }, [cart]);

  useEffect(() => {
    if (!checkIsAuthenticated()) {
      try {
        localStorage.setItem("sk-wish", JSON.stringify(wishlist));
      } catch {}
    }
  }, [wishlist]);

  // Add to cart
  const addToCart = async (p: Product, qty = 1): Promise<boolean> => {
    const isAuthed = checkIsAuthenticated();
    const pid = String(p.id);

    if (isAuthed) {
      try {
        await addItemToCartAPI(pid, qty);
        await refreshCart();
        return true;
      } catch (err: any) {
        console.error("Failed to add to cart on server:", err);
        toast.error("Could not add to cart", {
          description: err.message || "Please check available stock.",
        });
        return false;
      }
    } else {
      // Guest local update
      setCart((prev) => {
        const existing = prev.find((i) => String(i.product.id) === pid);
        if (existing) {
          return prev.map((i) =>
            String(i.product.id) === pid ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { product: p, qty }];
      });
      return true;
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemIdOrProductId: number | string) => {
    const isAuthed = checkIsAuthenticated();
    const targetItem = cart.find(
      (i) => i.id === cartItemIdOrProductId || String(i.product.id) === String(cartItemIdOrProductId)
    );

    // Optimistically update
    setCart((prev) =>
      prev.filter(
        (i) => i.id !== cartItemIdOrProductId && String(i.product.id) !== String(cartItemIdOrProductId)
      )
    );

    if (isAuthed && targetItem?.id) {
      try {
        await removeCartItemAPI(targetItem.id);
      } catch (err: any) {
        console.error("Failed to delete cart item on server:", err);
        toast.error("Failed to remove item from server");
        await refreshCart();
      }
    }
  };

  // Update item quantity
  const updateQty = async (cartItemIdOrProductId: number | string, qty: number) => {
    const isAuthed = checkIsAuthenticated();
    const targetItem = cart.find(
      (i) => i.id === cartItemIdOrProductId || String(i.product.id) === String(cartItemIdOrProductId)
    );

    if (qty <= 0) {
      await removeFromCart(cartItemIdOrProductId);
      return;
    }

    // Optimistic update
    setCart((prev) =>
      prev.map((i) => {
        if (i.id === cartItemIdOrProductId || String(i.product.id) === String(cartItemIdOrProductId)) {
          return { ...i, qty };
        }
        return i;
      })
    );

    if (isAuthed && targetItem?.id) {
      try {
        await updateCartItemQtyAPI(targetItem.id, qty);
      } catch (err: any) {
        console.error("Failed to update quantity on server:", err);
        toast.error("Could not update quantity", {
          description: err.message || "Stock limit reached.",
        });
        await refreshCart();
      }
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    const isAuthed = checkIsAuthenticated();
    setCart([]);
    if (isAuthed) {
      try {
        await clearCartAPI();
      } catch (err: any) {
        console.error("Failed to clear cart on server:", err);
        await refreshCart();
      }
    } else {
      try {
        localStorage.removeItem("sk-cart");
      } catch {}
    }
  };

  // Toggle wishlist item
  const toggleWishlist = async (productId: string, productObj?: Product): Promise<boolean> => {
    const pid = String(productId);
    const isAuthed = checkIsAuthenticated();
    const alreadyWished = wishlist.includes(pid);

    // Optimistically update
    if (alreadyWished) {
      setWishlist((prev) => prev.filter((id) => id !== pid));
      setWishlistProducts((prev) => prev.filter((p) => String(p.id) !== pid));
    } else {
      setWishlist((prev) => [...prev, pid]);
      if (productObj) {
        setWishlistProducts((prev) => [...prev, productObj]);
      }
    }

    if (isAuthed) {
      try {
        const res = await toggleWishlistItemAPI(pid);
        if (res.wished !== !alreadyWished) {
          // Re-sync if state differs
          await refreshWishlist();
        }
        return res.wished;
      } catch (err: any) {
        console.error("Failed to toggle wishlist on server:", err);
        toast.error("Failed to update wishlist", { description: err.message });
        await refreshWishlist();
        return alreadyWished;
      }
    }

    return !alreadyWished;
  };

  // Remove directly from wishlist
  const removeFromWishlist = async (productId: string) => {
    const pid = String(productId);
    const isAuthed = checkIsAuthenticated();

    setWishlist((prev) => prev.filter((id) => id !== pid));
    setWishlistProducts((prev) => prev.filter((p) => String(p.id) !== pid));

    if (isAuthed) {
      try {
        await removeWishlistItemAPI(pid);
      } catch (err: any) {
        console.error("Failed to remove item from wishlist:", err);
        toast.error("Failed to remove item", { description: err.message });
        await refreshWishlist();
      }
    }
  };

  // Move wishlist item to cart
  const moveWishlistToCart = async (productId: string, qty: number = 1) => {
    const pid = String(productId);
    const isAuthed = checkIsAuthenticated();

    if (isAuthed) {
      try {
        await moveWishlistToCartAPI(pid, qty);
        toast.success("Moved to cart!");
        await Promise.all([refreshCart(), refreshWishlist()]);
      } catch (err: any) {
        console.error("Failed to move wishlist item to cart:", err);
        toast.error("Could not move item to cart", {
          description: err.message || "Product may be out of stock.",
        });
      }
    } else {
      // Find the product in wishlistProducts or cart
      const prod = wishlistProducts.find((p) => String(p.id) === pid);
      if (prod) {
        await addToCart(prod, qty);
        await removeFromWishlist(pid);
        toast.success("Moved to cart!");
      }
    }
  };

  const isWished = useCallback(
    (id: string) => wishlist.includes(String(id)),
    [wishlist]
  );

  const cartCount = useMemo(
    () => cart.reduce((n, i) => n + i.qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((n, i) => n + i.qty * (i.product?.price || 0), 0),
    [cart]
  );

  const value = useMemo<StoreCtx>(
    () => ({
      cart,
      wishlist,
      wishlistProducts,
      isLoadingCart,
      isLoadingWishlist,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      toggleWishlist,
      removeFromWishlist,
      moveWishlistToCart,
      isWished,
      cartCount,
      cartTotal,
      refreshCart,
      refreshWishlist,
    }),
    [
      cart,
      wishlist,
      wishlistProducts,
      isLoadingCart,
      isLoadingWishlist,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      toggleWishlist,
      removeFromWishlist,
      moveWishlistToCart,
      isWished,
      cartCount,
      cartTotal,
      refreshCart,
      refreshWishlist,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
