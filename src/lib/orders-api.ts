import { getAccessToken } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://coast-peak-studio.onrender.com").replace(/\/+$/, "");

export interface DropdownOrderProduct {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  item_total: number;
  image?: string | null;
}

export interface DropdownOrderUser {
  name: string;
  email: string;
  phone?: string;
}

export interface DropdownOrder {
  id: number;
  order_number: string;
  label: string;
  status: string;
  status_display: string;
  created_at: string;
  total_amount: number;
  user: DropdownOrderUser;
  products: DropdownOrderProduct[];
}

export interface OrderListItemProduct {
  id: number | string;
  product: number | string;
  product_name: string;
  unit_price: string | number;
  quantity: number;
  item_total: number;
  image?: string | null;
}

export interface OrderRecord {
  id: number;
  order_number: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  customer_name: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  payment_method?: string;
  subtotal: string | number;
  shipping_fee: string | number;
  total_amount: string | number;
  status: string;
  status_display: string;
  total_items: number;
  created_at: string;
  updated_at: string;
  items: OrderListItemProduct[];
}

export interface OrderListFilters {
  status?: string;
  search?: string;
  email?: string;
}

export interface TrackingTimelineStep {
  key: string;
  title: string;
  description: string;
  state: "completed" | "current" | "upcoming";
  icon: string;
}

export interface TrackingUser {
  name: string;
  email: string;
  phone?: string;
  shipping_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

export interface TrackingSummary {
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: string;
  total_items: number;
}

export interface TrackingResponse {
  order_number: string;
  order_id: number;
  current_status: string;
  current_status_display: string;
  created_at: string;
  updated_at: string;
  is_cancelled: boolean;
  user: TrackingUser;
  timeline: TrackingTimelineStep[];
  products: DropdownOrderProduct[];
  summary: TrackingSummary;
}

/**
 * 1. Fetch Orders for Dropdown selection
 */
export async function fetchOrdersDropdownAPI(email?: string): Promise<DropdownOrder[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/orders/dropdown/`);
    if (email) {
      url.searchParams.append("email", email.trim());
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Failed to load orders for dropdown:", err);
    return [];
  }
}

/**
 * 2. Fetch Detailed Order Tracking Timeline and Info
 */
export async function fetchOrderTrackingAPI(orderNumber: string): Promise<TrackingResponse | null> {
  try {
    const cleanNumber = orderNumber.replace(/^#/, "").trim();
    if (!cleanNumber) return null;

    const url = `${API_BASE_URL}/api/orders/track/${encodeURIComponent(cleanNumber)}/`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      // Try fallback query param
      const queryUrl = `${API_BASE_URL}/api/orders/track/?number=${encodeURIComponent(cleanNumber)}`;
      const queryRes = await fetch(queryUrl, { headers });
      if (!queryRes.ok) return null;
      return queryRes.json();
    }
    return res.json();
  } catch (err) {
    console.warn(`Failed to track order ${orderNumber}:`, err);
    return null;
  }
}

/**
 * 3. Update Order Status (for seller/dashboard fulfillment)
 */
export async function updateOrderStatusAPI(
  orderNumber: string,
  newStatus: string
): Promise<TrackingResponse> {
  const cleanNumber = orderNumber.replace(/^#/, "").trim();
  const url = `${API_BASE_URL}/api/orders/track/${encodeURIComponent(cleanNumber)}/status/`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: newStatus }),
  });

  if (!res.ok) {
    let errorDetail = "Failed to update order status";
    try {
      const errData = await res.json();
      if (errData.status) {
        errorDetail = Array.isArray(errData.status) ? errData.status.join(" ") : String(errData.status);
      } else if (errData.detail) {
        errorDetail = errData.detail;
      } else {
        errorDetail = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ");
      }
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || "Failed to update order status");
  }

  return res.json();
}

/**
 * 4. Fetch All Orders List from API (GET /api/orders/)
 * Supports optional filters: status, search, email
 */
export async function fetchAllOrdersAPI(
  filters?: OrderListFilters
): Promise<OrderRecord[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/orders/`);
    if (filters?.status && filters.status !== "all") {
      url.searchParams.append("status", filters.status.trim());
    }
    if (filters?.search && filters.search.trim()) {
      url.searchParams.append("search", filters.search.trim());
    }
    if (filters?.email && filters.email.trim()) {
      url.searchParams.append("email", filters.email.trim());
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) {
      console.warn(`Failed to fetch orders (${res.status}):`, await res.text());
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Failed to load all orders:", err);
    return [];
  }
}

// Convenient alias matching user specification
export const getAllOrders = fetchAllOrdersAPI;

export interface TrackStatusParams {
  email?: string;
  productId?: string | number;
  orderNumber?: string;
}

export interface UserTrackedOrdersResponse {
  count?: number;
  user?: {
    email: string;
    name?: string;
  };
  orders?: TrackingResponse[];
  detail?: string;
  is_found?: boolean;
}

/**
 * 5. Track Order Status according to User logged in and Products
 * POST /api/orders/track-status/
 * Also supports optional orderNumber, email, and productId
 */
export async function trackByCustomerAndProduct(
  params: TrackStatusParams
): Promise<TrackingResponse | UserTrackedOrdersResponse> {
  const token = getAccessToken();
  const url = `${API_BASE_URL}/api/orders/track-status/`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const cleanOrderNum = params.orderNumber
    ? params.orderNumber.replace(/^#/, "").trim()
    : undefined;

  const body: Record<string, any> = {};
  if (params.email?.trim()) body.email = params.email.trim();
  if (
    params.productId !== undefined &&
    params.productId !== null &&
    String(params.productId).trim() !== "" &&
    String(params.productId).toLowerCase() !== "all"
  ) {
    body.product_id = String(params.productId);
  }
  if (cleanOrderNum) {
    body.order_number = cleanOrderNum;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "No matching orders found");
  }

  return data;
}

export const trackOrdersByUserAndProductAPI = trackByCustomerAndProduct;

export interface OrderHistoryItem {
  id: number | string;
  product: number | string;
  product_id?: number | string;
  product_name: string;
  unit_price: string | number;
  quantity: number;
  item_total: number;
  image?: string | null;
}

export interface OrderHistoryAddress {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
}

export interface OrderHistoryRecord {
  id: number;
  order_number: string;
  email: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  customer_name?: string;
  shipping_address?: OrderHistoryAddress;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  payment_method?: string;
  payment_method_display?: string;
  subtotal: string | number;
  shipping_fee: string | number;
  total_amount: string | number;
  status: string;
  status_display: string;
  total_items: number;
  created_at: string;
  updated_at: string;
  items: OrderHistoryItem[];
}

export interface OrderHistoryResponse {
  count: number;
  email?: string;
  orders: OrderHistoryRecord[];
}

/**
 * 6. Fetch Customer Order History
 * GET /api/orders/history/
 * Supports optional email and status query parameters.
 */
export async function fetchOrderHistoryAPI(params?: {
  email?: string;
  status?: string;
}): Promise<OrderHistoryResponse> {
  const token = getAccessToken();
  const url = new URL(`${API_BASE_URL}/api/orders/history/`);

  if (params?.email) url.searchParams.append("email", params.email.trim());
  if (params?.status && params.status !== "all") {
    url.searchParams.append("status", params.status.trim());
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new Error(`Failed to load order history (${res.status})`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return { count: data.length, orders: data };
  }
  return {
    count: data.count || (data.orders?.length ?? 0),
    email: data.email,
    orders: Array.isArray(data.orders) ? data.orders : [],
  };
}




