import { API_BASE_URL } from "../config/apiConfig";
import { ADMIN_PASSWORD } from "../config/authConfig";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      "Backend URL not configured. Set VITE_API_URL in your environment before building."
    );
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_PASSWORD,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(data) });
}

export function apiPut<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(data) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
