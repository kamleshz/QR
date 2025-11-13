export const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8182";
export const PUBLIC_BASE = import.meta.env.VITE_PUBLIC_BASE_URL || "http://localhost:5173";
export async function api(path, opts = {}) {
  const res = await fetch(API + path, opts);
  const ctype = res.headers.get("content-type") || "";
  const data = ctype.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error(typeof data === "string" ? data : data?.error || "Request failed");
  return data;
}
