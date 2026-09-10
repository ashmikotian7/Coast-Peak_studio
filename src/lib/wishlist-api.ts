import { getAccessToken } from "./auth";
import { getFallbackImage, type Product } from "./products";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export interface WishlistProduct {
  id: string | number;
  name: string;
  price: number;
  image: string;
  category_slug?: string;
  stock?: number;
}

export interface WishlistItemResponse {
  id: number;
  added_at: string;
  product: WishlistProduct;
}

export interface WishlistResponse {
  count: number;
  items: WishlistItemResponse[];
  product_ids: string[];
}

export interface ToggleWishlistResponse {
  product_id: string;
  wished: boolean;
  message?: string;
}

export interface MoveToCartResponse {
  message?: string;
}

async function wishlistFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("User is not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = "Wishlist request failed";
    try {
      const errorData = await response.json();
      if (errorData.error) errorDetail = errorData.error;
      else if (errorData.detail) errorDetail = errorData.detail;
      else if (errorData.message) errorDetail = errorData.message;
      else {
        errorDetail = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ");
      }
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || "Wishlist request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Normalizes a WishlistProduct from the API into our UI's Product type
 */
export function normalizeWishlistProduct(p: WishlistProduct): Product {
  return {
    id: String(p.id),
    name: p.name,
    price: Number(p.price),
    image: p.image || getFallbackImage(p.category_slug),
    category: (p.category_slug || "rings") as Product["category"],
    description: "",
    stock: Number(p.stock ?? 0),
  };
}

/**
 * 1. Retrieve User Wishlist
 */
export async function fetchWishlistAPI(): Promise<WishlistResponse> {
  return wishlistFetch<WishlistResponse>("/api/wishlist/");
}

/**
 * 2. Toggle Wishlist Item
 */
export async function toggleWishlistItemAPI(productId: string): Promise<ToggleWishlistResponse> {
  return wishlistFetch<ToggleWishlistResponse>("/api/wishlist/toggle/", {
    method: "POST",
    body: JSON.stringify({ product_id: String(productId) }),
  });
}

/**
 * 3. Remove Item from Wishlist directly by product_id
 */
export async function removeWishlistItemAPI(productId: string): Promise<void> {
  await wishlistFetch<void>(`/api/wishlist/items/${productId}/`, {
    method: "DELETE",
  });
}

/**
 * 4. Move Wishlist Item to Cart
 */
export async function moveWishlistToCartAPI(
  productId: string,
  quantity: number = 1
): Promise<MoveToCartResponse> {
  return wishlistFetch<MoveToCartResponse>("/api/wishlist/move-to-cart/", {
    method: "POST",
    body: JSON.stringify({ product_id: String(productId), quantity }),
  });
}

/**
 * 5. Merge Guest Wishlist on Login / Signup
 */
export async function mergeWishlistAPI(
  productIds: string[]
): Promise<{ product_ids: string[] }> {
  return wishlistFetch<{ product_ids: string[] }>("/api/wishlist/merge/", {
    method: "POST",
    body: JSON.stringify({ product_ids: productIds.map(String) }),
  });
}
