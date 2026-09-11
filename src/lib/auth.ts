export interface User {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  country?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface DirectSignupPayload {
  signup_type: "direct";
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
  phone_number: string;
  country: string;
}

export interface GoogleSignupPayload {
  signup_type: "google";
  full_name: string;
  email: string;
}

export interface DirectLoginPayload {
  login_type: "direct";
  email: string;
  password: string;
}

export interface GoogleLoginPayload {
  login_type: "google";
  email: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://coast-peak-studio.onrender.com").replace(/\/+$/, "");

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    let errMsg = "Request failed";
    if (typeof error === "object" && error !== null) {
      if (error.detail) errMsg = error.detail;
      else if (error.message) errMsg = error.message;
      else {
        const firstKey = Object.keys(error)[0];
        if (firstKey) {
          const val = error[firstKey];
          errMsg = `${firstKey}: ${Array.isArray(val) ? val.join(", ") : val}`;
        }
      }
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export async function signup(
  payload: DirectSignupPayload | GoogleSignupPayload
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/signup/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(
  payload: DirectLoginPayload | GoogleLoginPayload
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutAPI(): Promise<void> {
  const token = getAccessToken();
  const refresh = getRefreshToken();
  if (!refresh) return;
  try {
    await apiRequest<void>("/api/auth/logout/", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ refresh }),
    });
  } catch (err) {
    console.warn("Logout API call error:", err);
  }
}

export async function fetchProfileAPI(): Promise<User> {
  const token = getAccessToken();
  return apiRequest<User>("/api/auth/profile/", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function updateProfileAPI(payload: Partial<User>): Promise<User> {
  const token = getAccessToken();
  return apiRequest<User>("/api/auth/profile/", {
    method: "PATCH",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify(payload),
  });
}

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

export function setAuthTokens(access: string, refresh: string) {
  if (isBrowser) {
    try {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
    } catch (e) {
      // Ignore localStorage errors (e.g., in private browsing mode)
    }
  }
}

export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem("access_token");
  } catch (e) {
    return null;
  }
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem("refresh_token");
  } catch (e) {
    return null;
  }
}

export function clearAuthTokens() {
  if (isBrowser) {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

export function setUser(user: User) {
  if (isBrowser) {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

export function getUser(): User | null {
  if (!isBrowser) return null;
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function clearUser() {
  if (isBrowser) {
    try {
      localStorage.removeItem("user");
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
