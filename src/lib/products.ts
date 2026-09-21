import earrings from "@/assets/product-earrings.jpg";
import necklace from "@/assets/product-necklace.jpg";
import rings from "@/assets/product-rings.jpg";
import bracelet from "@/assets/product-bracelet.jpg";
import { getAccessToken, authenticatedFetch } from "./auth";

export type Product = {
  id: string;
  sku?: string;
  name: string;
  price: number;
  image: string;
  category: "earrings" | "necklaces" | "rings" | "bracelets";
  tag?: "new" | "bestseller" | "limited";
  description: string;
  stock: number;
};

export const products: Product[] = [];

export const collections = [
  { slug: "earrings", name: "Earrings", tagline: "Whispers for the ear" },
  { slug: "necklaces", name: "Necklaces", tagline: "Worn close to the heart" },
  { slug: "rings", name: "Rings", tagline: "Promises in crystal" },
  { slug: "bracelets", name: "Bracelets", tagline: "Heirlooms in motion" },
];

export const DEFAULT_CATEGORY_MAP: Record<string, number> = {
  earrings: 1,
  necklaces: 2,
  rings: 3,
  bracelets: 4,
};

export function resolveCategoryId(category: string | number): number | string {
  if (typeof category === "number") return category;
  const num = Number(category);
  if (!isNaN(num) && String(category).trim() !== "") {
    return num;
  }
  const slug = String(category).toLowerCase().trim();
  return DEFAULT_CATEGORY_MAP[slug] ?? category;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://coast-peak-studio.onrender.com").replace(/\/+$/, "");

export function getFallbackImage(category?: string): string {
  switch (category?.toLowerCase()) {
    case "rings":
      return rings;
    case "necklaces":
      return necklace;
    case "bracelets":
      return bracelet;
    default:
      return earrings;
  }
}

export async function fetchProductsFromAPI(categorySlug?: string): Promise<Product[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/products/items/`);
    if (categorySlug) {
      url.searchParams.append("category", categorySlug);
    }
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("API response error");
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: String(item.id),
        sku: item.sku || undefined,
        name: item.name,
        price: Number(item.price),
        image: item.image || getFallbackImage(item.category_slug),
        category: (item.category_slug || "earrings") as Product["category"],
        tag: item.tag || undefined,
        description: item.description || "",
        stock: item.stock ?? 0,
      }));
    }
  } catch (err) {
    console.error("Backend API unavailable:", err);
  }
  return [];
}

export async function fetchProductByIdFromAPI(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/items/${id}/`);
    if (!response.ok) return null;
    const item = await response.json();
    return {
      id: String(item.id),
      sku: item.sku || undefined,
      name: item.name,
      price: Number(item.price),
      image: item.image || getFallbackImage(item.category_slug),
      category: (item.category_slug || "earrings") as Product["category"],
      tag: item.tag || undefined,
      description: item.description || "",
      stock: item.stock ?? 0,
    };
  } catch (err) {
    console.error(`Failed to fetch product ${id} from DB:`, err);
    return null;
  }
}

async function parseResponseError(response: Response, defaultMsg = "Operation failed"): Promise<string> {
  try {
    const rawText = await response.text();
    if (!rawText) return `${defaultMsg} (HTTP ${response.status})`;
    try {
      const errorData = JSON.parse(rawText);
      if (errorData && typeof errorData === "object") {
        return Object.entries(errorData)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join("; ");
      }
    } catch {
      if (rawText.includes("<title>")) {
        const match = rawText.match(/<title>(.*?)<\/title>/i);
        if (match) return match[1].replace(/\s+/g, " ").trim();
      }
      if (rawText.length < 200) return rawText;
    }
    return `${defaultMsg} (HTTP ${response.status})`;
  } catch {
    return `${defaultMsg} (HTTP ${response.status})`;
  }
}

export async function deleteProductFromAPI(id: string): Promise<void> {
  const response = await authenticatedFetch(`${API_BASE_URL}/api/products/items/${id}/`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    const errorDetail = await parseResponseError(response, `Failed to delete product ${id}`);
    throw new Error(errorDetail);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

export async function compressImageToDataUrl(file: File, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      resolve(fileToDataUrl(file));
      return;
    }
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(fileToDataUrl(file));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(mime, quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(fileToDataUrl(file));
    };
    img.src = objectUrl;
  });
}

export async function updateProductInCatalog(
  id: string,
  data: SaveProductInput,
  imageFile?: File | null,
  imageBase64?: string | null
): Promise<Product> {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.price !== undefined) formData.append("price", String(data.price));
  if (data.category) formData.append("category", String(resolveCategoryId(data.category)));
  if (data.tag !== undefined) {
    const tagVal = data.tag?.trim();
    formData.append("tag", !tagVal || tagVal === "none" || tagVal === "— None —" ? "— None —" : tagVal);
  }
  if (data.stock !== undefined) formData.append("stock", String(data.stock));
  if (data.description !== undefined) formData.append("description", data.description);
  if (imageFile) {
    formData.append("image", imageFile);
  } else if (imageBase64 && imageBase64.startsWith("data:")) {
    formData.append("image_base64", imageBase64);
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/api/products/items/${id}/`, {
    method: "PATCH",
    body: formData,
  });

  if (!response.ok) {
    const errorDetail = await parseResponseError(response, "Failed to update product in database");
    throw new Error(errorDetail);
  }

  const updated = await response.json();
  return {
    id: String(updated.id),
    sku: updated.sku,
    name: updated.name,
    price: Number(updated.price),
    image: updated.image || imageBase64 || getFallbackImage(updated.category_slug || data.category),
    category: (updated.category_slug || data.category || "rings") as Product["category"],
    tag: updated.tag || undefined,
    description: updated.description || "",
    stock: Number(updated.stock ?? 0),
  };
}

export interface SaveProductInput {
  name: string;
  price: string | number;
  category: string | number;
  tag?: string;
  stock?: string | number;
  description?: string;
}

export async function saveProductToCatalog(
  step1Data: SaveProductInput,
  step2ImageFile?: File | null,
  step2ImageBase64?: string | null
): Promise<Product> {
  const formData = new FormData();
  // Step 1 fields
  formData.append("name", step1Data.name);
  const cleanPrice = parseFloat(String(step1Data.price).replace(/[^0-9.]/g, "")) || 0;
  const safePrice = Math.min(Math.max(cleanPrice, 0.01), 99999999.99).toFixed(2);
  formData.append("price", safePrice);
  formData.append("category", String(resolveCategoryId(step1Data.category)));
  // Tag normalization: default "— None —", "none", or "" converts to null
  const tagVal = step1Data.tag?.trim();
  formData.append("tag", !tagVal || tagVal === "none" || tagVal === "— None —" ? "— None —" : tagVal);
  formData.append("stock", String(step1Data.stock ?? 0));
  formData.append("description", step1Data.description || "");

  // When a file is provided, send it directly as multipart file (avoids RequestDataTooBig)
  if (step2ImageFile) {
    formData.append("image", step2ImageFile);
  } else if (step2ImageBase64 && step2ImageBase64.startsWith("data:")) {
    formData.append("image_base64", step2ImageBase64);
  }

  const response = await authenticatedFetch(`${API_BASE_URL}/api/products/items/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorDetail = await parseResponseError(response, "Failed to add product");
    throw new Error(errorDetail);
  }

  const newProduct = await response.json();
  console.log("Saved to database successfully:", newProduct);

  return {
    id: String(newProduct.id),
    sku: newProduct.sku,
    name: newProduct.name,
    price: Number(newProduct.price),
    image: newProduct.image || getFallbackImage(newProduct.category_slug || step1Data.category),
    category: (newProduct.category_slug || step1Data.category || "rings") as Product["category"],
    tag: newProduct.tag || undefined,
    description: newProduct.description || "",
    stock: Number(newProduct.stock ?? 0),
  };
}

export async function createProduct(formData: FormData): Promise<Product> {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/api/products/items/`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      let errText = "Failed to create product";
      try {
        const errorData = await response.json();
        errText = JSON.stringify(errorData);
      } catch {
        errText = await response.text();
      }
      throw new Error(errText || "Failed to create product");
    }
    const data = await response.json();
    return {
      id: String(data.id),
      sku: data.sku,
      name: data.name,
      price: Number(data.price),
      image: data.image || getFallbackImage(data.category_slug),
      category: (data.category_slug || "earrings") as Product["category"],
      tag: data.tag || undefined,
      description: data.description || "",
      stock: data.stock ?? 0,
    };
  } catch (err) {
    console.warn("Backend API product creation error:", err);
    throw err;
  }
}

function mapRawProduct(item: any): Product {
  return {
    id: String(item.id),
    sku: item.sku || undefined,
    name: item.name,
    price: Number(item.price),
    image: item.image || getFallbackImage(item.category_slug),
    category: (item.category_slug || "earrings") as Product["category"],
    tag: item.tag || undefined,
    description: item.description || "",
    stock: item.stock ?? 0,
  };
}

export async function fetchProductsByTag(tag: string): Promise<Product[]> {
  try {
    const normalizedTag = tag.toLowerCase().trim();
    let endpoint = `/api/products/${normalizedTag}/`;
    if (normalizedTag === "bestseller") {
      endpoint = `/api/products/bestsellers/`;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      const fallbackRes = await fetch(`${API_BASE_URL}/api/products/items/?tag=${encodeURIComponent(normalizedTag)}`);
      if (!fallbackRes.ok) throw new Error(`Failed to load ${tag} products`);
      const fallbackData = await fallbackRes.json();
      return Array.isArray(fallbackData) ? fallbackData.map(mapRawProduct) : [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data.map(mapRawProduct) : [];
  } catch (err) {
    console.error(`Error fetching products for tag ${tag}:`, err);
    return [];
  }
}

export async function fetchGroupedProductsByTag(): Promise<{
  new: Product[];
  bestsellers: Product[];
  limited: Product[];
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/by-tag/`);
    if (!response.ok) throw new Error("Failed to load grouped tag products");
    const data = await response.json();
    return {
      new: Array.isArray(data.new) ? data.new.map(mapRawProduct) : [],
      bestsellers: Array.isArray(data.bestsellers) ? data.bestsellers.map(mapRawProduct) : [],
      limited: Array.isArray(data.limited) ? data.limited.map(mapRawProduct) : [],
    };
  } catch (err) {
    console.error("Error fetching grouped products by tag:", err);
    return { new: [], bestsellers: [], limited: [] };
  }
}

