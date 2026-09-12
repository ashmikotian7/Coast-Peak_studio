/**
 * Razorpay Standard Web Checkout Client Integration
 * Script: https://checkout.razorpay.com/v1/checkout.js
 */

export interface RazorpayOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler?: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
    hide_topbar?: boolean;
  };
  modal?: {
    backdropclose?: boolean;
    escape?: boolean;
    handleback?: boolean;
    confirm_close?: boolean;
    ondismiss?: () => void;
    animation?: boolean;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
      close: () => void;
    };
  }
}

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

/**
 * Dynamically loads the Razorpay checkout script if not already present
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Calls backend POST /api/create-order
 */
export async function createCheckoutOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
}): Promise<RazorpayOrderResponse> {
  let res: Response;
  try {
    res = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
  } catch (err: unknown) {
    throw new Error(`Could not connect to payment server: ${(err as Error)?.message || "Network error"}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new Error(`Server returned non-JSON response (${res?.status || "Unknown status"})`);
  }

  if (!res.ok) {
    const errorMsg = (data?.error as string) || (data?.message as string) || `Order creation failed (${res.status})`;
    throw new Error(errorMsg);
  }

  if (!data?.order_id) {
    throw new Error("Invalid order response: missing order_id from server");
  }

  return data as unknown as RazorpayOrderResponse;
}

/**
 * Calls backend POST /api/verify-payment
 */
export async function verifyPayment(
  paymentData: RazorpaySuccessResponse
): Promise<{ success: boolean; message: string }> {
  let res: Response;
  try {
    res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });
  } catch (err: unknown) {
    throw new Error(`Could not connect to verification server: ${(err as Error)?.message || "Network error"}`);
  }

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new Error(`Server returned non-JSON response during verification (${res?.status || "Unknown status"})`);
  }

  if (!res.ok || !data.success) {
    const msg = (data?.message as string) || (data?.error as string) || "Payment verification failed";
    throw new Error(msg);
  }

  return data as unknown as { success: boolean; message: string };
}
