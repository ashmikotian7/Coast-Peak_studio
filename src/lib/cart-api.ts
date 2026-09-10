import { getAccessToken } from "./auth";
import { getFallbackImage, type Product } from "./products";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category_slug?: string;
  stock: number;
  is_in_stock?: boolean;
}

export interface CartItemResponse {
  id: number;
  quantity: number;
  item_total: number;
  product: CartProduct;
  created_at?: string;
  updated_at?: string;
}

export interface CartResponse {
  id: number;
  total_items: number;
  subtotal: number;
  items: CartItemResponse[];
  created_at?: string;
  updated_at?: string;
}

export interface AddCartItemPayload {
  product_id: string;
  quantity: number;
}

export interface AddCartItemResponse {
  id: number;
  product_id: string;
  quantity: number;
  message?: string;
}

export interface UpdateCartItemResponse {
  id: number;
  quantity: number;
  item_total: number;
  message?: string;
}

async function cartFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
    let errorDetail = "Cart request failed";
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
    throw new Error(errorDetail || "Cart request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Normalizes a CartProduct from the API into our UI's Product type
 */
export function normalizeCartProduct(p: CartProduct): Product {
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
 * 1. Retrieve current user's cart
 */
export async function fetchCartAPI(): Promise<CartResponse> {
  return cartFetch<CartResponse>("/api/cart/");
}

/**
 * 2. Add item to cart
 */
export async function addItemToCartAPI(productId: string, quantity: number = 1): Promise<AddCartItemResponse> {
  return cartFetch<AddCartItemResponse>("/api/cart/items/", {
    method: "POST",
    body: JSON.stringify({ product_id: String(productId), quantity }),
  });
}

/**
 * 3. Update cart item quantity by cartItemId
 */
export async function updateCartItemQtyAPI(cartItemId: number, quantity: number): Promise<UpdateCartItemResponse> {
  return cartFetch<UpdateCartItemResponse>(`/api/cart/items/${cartItemId}/`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

/**
 * 4. Remove single item from cart by cartItemId
 */
export async function removeCartItemAPI(cartItemId: number): Promise<void> {
  await cartFetch<void>(`/api/cart/items/${cartItemId}/`, {
    method: "DELETE",
  });
}

/**
 * 5. Clear entire cart
 */
export async function clearCartAPI(): Promise<{ message?: string }> {
  return cartFetch<{ message?: string }>("/api/cart/clear/", {
    method: "DELETE",
  });
}

/**
 * 6. Merge guest cart into user cart
 */
export async function mergeCartAPI(
  items: { product_id: string; quantity: number }[]
): Promise<CartResponse> {
  return cartFetch<CartResponse>("/api/cart/merge/", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
