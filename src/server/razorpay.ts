import Razorpay from "razorpay";
import crypto from "node:crypto";

export interface CreateOrderInput {
  amount: number;
  currency?: string;
  receipt?: string;
}

export interface VerifyPaymentInput {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  order_id?: string;
  payment_id?: string;
  signature?: string;
}

import fs from "node:fs";
import path from "node:path";

function parseEnvFile(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const cwd = typeof process !== "undefined" && process.cwd ? process.cwd() : ".";
    const envPaths = [
      path.resolve(cwd, ".env"),
      path.resolve(cwd, ".env.local"),
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            result[key] = val;
            if (typeof process !== "undefined" && process.env && !process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    }
  } catch {
    // Non-filesystem environments
  }
  return result;
}

export function getRazorpayCredentials(env?: unknown): { keyId: string; keySecret: string } {
  const fileEnv = parseEnvFile();
  const envRecord = (env && typeof env === "object" ? env : {}) as Record<string, string | undefined>;

  const keyId =
    envRecord.RAZORPAY_KEY_ID ||
    (typeof process !== "undefined" && process.env ? process.env.RAZORPAY_KEY_ID : "") ||
    fileEnv.RAZORPAY_KEY_ID ||
    (typeof process !== "undefined" && process.env ? process.env.VITE_RAZORPAY_KEY_ID : "") ||
    fileEnv.VITE_RAZORPAY_KEY_ID ||
    (import.meta as unknown as { env?: Record<string, string> })?.env?.VITE_RAZORPAY_KEY_ID ||
    "";

  const keySecret =
    envRecord.RAZORPAY_KEY_SECRET ||
    (typeof process !== "undefined" && process.env ? process.env.RAZORPAY_KEY_SECRET : "") ||
    fileEnv.RAZORPAY_KEY_SECRET ||
    "";

  return { keyId, keySecret };
}

/**
 * STEP 1: BACKEND - Create Order
 * - Endpoint: POST /api/create-order
 * - Validates integer amount between 100 paise (₹1) and 100,000,000 paise (₹10,00,000)
 * - Validates currency against whitelist (INR, USD)
 * - Sanitizes receipt identifier
 * - Handles auth failures (401)
 * - Handles Razorpay API errors (500)
 * - Returns { order_id, amount, currency }
 */
export async function processCreateOrder(
  body: CreateOrderInput,
  env?: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
  const { keyId, keySecret } = getRazorpayCredentials(env);

  if (!keyId || !keySecret) {
    return {
      status: 401,
      data: {
        error: "Authentication failed. Razorpay credentials are not configured on server.",
      },
    };
  }

  const rawAmount = Number(body.amount);
  if (!Number.isInteger(rawAmount) || rawAmount < 100 || rawAmount > 100_000_000) {
    return {
      status: 400,
      data: {
        error: "Invalid amount. Must be an integer between 100 paise (₹1) and 100,000,000 paise.",
      },
    };
  }

  const rawCurrency = (body.currency || "INR").toUpperCase().trim();
  const ALLOWED_CURRENCIES = ["INR", "USD"];
  if (!ALLOWED_CURRENCIES.includes(rawCurrency)) {
    return {
      status: 400,
      data: {
        error: `Unsupported currency. Allowed: ${ALLOWED_CURRENCIES.join(", ")}`,
      },
    };
  }
  const currency = rawCurrency;

  const rawReceipt = body.receipt
    ? String(body.receipt).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40)
    : "";
  const receipt = rawReceipt || `rcpt_${Date.now()}`;

  try {
    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
    const apiRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: rawAmount,
        currency,
        receipt,
      }),
    });

    const order = (await apiRes.json()) as {
      id?: string;
      amount?: number;
      currency?: string;
      error?: { description?: string; code?: string };
      message?: string;
    };

    if (!apiRes.ok || !order.id) {
      const errorMsg =
        order?.error?.description || order?.message || "Razorpay rejected the order creation request";
      return {
        status: apiRes.status || 500,
        data: { error: errorMsg },
      };
    }

    return {
      status: 200,
      data: {
        order_id: order.id,
        amount: order.amount ?? rawAmount,
        currency: order.currency ?? currency,
      },
    };
  } catch (err: unknown) {
    console.error("Razorpay order creation error:", err);
    return {
      status: 500,
      data: {
        error: (err as Error)?.message || "Failed to create Razorpay order",
      },
    };
  }
}

/**
 * STEP 3: BACKEND - Verify Signature
 * - Endpoint: POST /api/verify-payment
 * - Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * - Timing-attack resistant verification with crypto.timingSafeEqual
 * - Validates missing & malformed fields (400)
 * - Returns 400 on signature mismatch (do NOT mark as paid)
 * - Returns 200 on success
 */
export async function processVerifyPayment(
  body: VerifyPaymentInput,
  env?: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const { keySecret } = getRazorpayCredentials(env);

    const orderId = String(body.razorpay_order_id || body.order_id || "").trim();
    const paymentId = String(body.razorpay_payment_id || body.payment_id || "").trim();
    const signature = String(body.razorpay_signature || body.signature || "").trim();

    if (!orderId || !paymentId || !signature) {
      return {
        status: 400,
        data: {
          success: false,
          message: "Missing required payment fields: razorpay_order_id, razorpay_payment_id, razorpay_signature",
        },
      };
    }

    if (orderId.length > 100 || paymentId.length > 100 || signature.length > 128) {
      return {
        status: 400,
        data: {
          success: false,
          message: "Invalid field length in payment verification payload.",
        },
      };
    }

    if (!keySecret) {
      return {
        status: 401,
        data: {
          success: false,
          message: "Authentication failed. Razorpay key secret is not configured.",
        },
      };
    }

    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "utf8");
    const genBuf = Buffer.from(generatedSignature, "utf8");

    // Timing-attack safe comparison (constant-time verification)
    const isMatch = sigBuf.length === genBuf.length && crypto.timingSafeEqual(sigBuf, genBuf);

    if (!isMatch) {
      return {
        status: 400,
        data: {
          success: false,
          message: "Signature mismatch. Payment verification failed.",
        },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        message: "Payment verified successfully",
        order_id: orderId,
        payment_id: paymentId,
      },
    };
  } catch (err: unknown) {
    console.error("Signature verification error:", err);
    return {
      status: 500,
      data: {
        success: false,
        message: "Internal server error during payment verification",
      },
    };
  }
}

export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": requestOrigin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

/**
 * Standard Web Request Handler for POST /api/create-order
 */
export async function handleCreateOrder(request: Request, env?: unknown): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  let body: CreateOrderInput = { amount: 0 };
  try {
    body = (await request.json()) as CreateOrderInput;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  const result = (await processCreateOrder(body, env)) || {
    status: 500,
    data: { error: "Unknown order processing error" },
  };

  return new Response(JSON.stringify(result.data || {}), {
    status: typeof result.status === "number" ? result.status : 500,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Standard Web Request Handler for POST /api/verify-payment
 */
export async function handleVerifyPayment(request: Request, env?: unknown): Promise<Response> {
  const origin = request.headers.get("origin");
  const headers = getCorsHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  let body: VerifyPaymentInput = {};
  try {
    body = (await request.json()) as VerifyPaymentInput;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  const result = (await processVerifyPayment(body, env)) || {
    status: 500,
    data: { success: false, message: "Unknown verification error" },
  };

  return new Response(JSON.stringify(result.data || {}), {
    status: typeof result.status === "number" ? result.status : 500,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Connect/Node Middleware for Vite dev server
 */
export function razorpayDevMiddleware(
  req: { url?: string; method?: string; headers?: Record<string, string | string[] | undefined>; on: (event: string, cb: (chunk?: unknown) => void) => void },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (content: string) => void },
  next: () => void
) {
  const url = req.url ? new URL(req.url, "http://localhost").pathname : "";

  const applySecurityHeaders = () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  };

  if (req.method === "OPTIONS" && (url === "/api/create-order" || url === "/api/verify-payment")) {
    res.statusCode = 204;
    applySecurityHeaders();
    res.end("");
    return;
  }

  if (url === "/api/create-order" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", async () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const result = (await processCreateOrder(body)) || {
          status: 500,
          data: { error: "Unknown order processing error" },
        };
        res.statusCode = typeof result.status === "number" ? result.status : 500;
        res.setHeader("Content-Type", "application/json");
        applySecurityHeaders();
        res.end(JSON.stringify(result.data || {}));
      } catch (err: unknown) {
        const msg = (err as Error)?.message || "Internal server error";
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        applySecurityHeaders();
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  if (url === "/api/verify-payment" && req.method === "POST") {
    let raw = "";
    req.on("data", (chunk) => {
      raw += String(chunk);
    });
    req.on("end", async () => {
      try {
        const body = raw ? JSON.parse(raw) : {};
        const result = (await processVerifyPayment(body)) || {
          status: 500,
          data: { success: false, message: "Unknown verification error" },
        };
        res.statusCode = typeof result.status === "number" ? result.status : 500;
        res.setHeader("Content-Type", "application/json");
        applySecurityHeaders();
        res.end(JSON.stringify(result.data || {}));
      } catch (err: unknown) {
        const msg = (err as Error)?.message || "Internal server error";
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        applySecurityHeaders();
        res.end(JSON.stringify({ error: msg }));
      }
    });
    return;
  }

  next();
}

