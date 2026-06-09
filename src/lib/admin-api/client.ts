import type { AdminRefreshBody, AdminTokenPair, ApiErrorBody } from "@/lib/admin-api/types";
import { clearAuthStorage, getAccessToken, getRefreshToken, setTokens } from "@/lib/auth/token-storage";

export class AdminApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  /** Populated when the error came from `fetch` so you can compare with Postman / Network tab. */
  readonly requestUrl?: string;
  readonly requestMethod?: string;

  constructor(
    message: string,
    status: number,
    body?: unknown,
    requestUrl?: string,
    requestMethod?: string,
  ) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.body = body;
    this.requestUrl = requestUrl;
    this.requestMethod = requestMethod;
  }
}

/** Normalize caught errors into user-facing strings for alerts and toasts. */
export function formatAdminApiError(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof AdminApiError) {
    if (error.status === 0) {
      return "API URL is not configured. Set NEXT_PUBLIC_ADMIN_API_URL in .env.local and restart the dev server.";
    }
    const fromBody = messageFromBody(error.body);
    if (fromBody && fromBody !== "Request failed") return fromBody;
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_ADMIN_API_URL?.trim();
  if (!raw) {
    throw new AdminApiError("NEXT_PUBLIC_ADMIN_API_URL is not configured", 0);
  }
  return raw.replace(/\/$/, "");
}

/** Safe snapshot for UI (e.g. login hints); returns null if env is unset. */
export function getAdminApiBaseUrlSnapshot(): string | null {
  try {
    return getBaseUrl();
  } catch {
    return null;
  }
}

export function adminUrl(path: string): string {
  const base = getBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function messageFromBody(body: unknown): string {
  if (!body || typeof body !== "object") return "Request failed";
  const b = body as ApiErrorBody & { statusCode?: number };

  if (Array.isArray(b.message)) {
    const parts = b.message.filter((m): m is string => typeof m === "string" && m.trim());
    if (parts.length) return parts.join(" ");
  }

  if (typeof b.message === "string" && b.message) return b.message;

  if (b.errors && typeof b.errors === "object") {
    const parts = Object.entries(b.errors).flatMap(([field, msgs]) => {
      if (!Array.isArray(msgs)) return [];
      return msgs.map((m) => `${field}: ${m}`);
    });
    if (parts.length) return parts.join(" ");
  }

  if (typeof b.error === "string" && b.error) return b.error;
  return "Request failed";
}

function logAdminApiFailure(method: string, url: string, status: number, body: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  // eslint-disable-next-line no-console -- intentional dev-only diagnostics for 404 vs path issues
  console.warn("[admin-api]", { method, url, status, body });
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

type AdminRequestOptions = RequestInit & {
  /** When false, do not send Bearer access token */
  auth?: boolean;
  /** Internal: skip refresh retry */
  _retry?: boolean;
};

export async function adminRequest<T>(
  path: string,
  init: AdminRequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    _retry = false,
    headers: initHeaders,
    method: initMethod,
    body,
    signal,
    cache,
  } = init;
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const access = getAccessToken();
    if (access) headers.set("Authorization", `Bearer ${access}`);
  }

  const url = adminUrl(path);
  const method = (initMethod ?? "GET").toString().toUpperCase();
  const res = await fetch(url, {
    method,
    body,
    headers,
    credentials: "omit",
    cache: cache ?? "no-store",
    signal,
  });
  const responseBody = await parseJsonSafe(res);

  if (res.status === 401 && auth && !_retry && !path.endsWith("/admin/auth/refresh")) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const pair = await refreshTokens(refreshToken);
        setTokens(pair.accessToken, pair.refreshToken);
        return adminRequest<T>(path, { ...init, _retry: true });
      } catch {
        clearAuthStorage();
      }
    } else {
      clearAuthStorage();
    }
  }

  if (!res.ok) {
    logAdminApiFailure(method, url, res.status, responseBody);
    throw new AdminApiError(messageFromBody(responseBody), res.status, responseBody, url, method);
  }

  return responseBody as T;
}

async function refreshTokens(refreshToken: string): Promise<AdminTokenPair> {
  const body: AdminRefreshBody = { refreshToken };
  const url = adminUrl("/admin/auth/refresh");
  const method = "POST";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
  });
  const json = (await parseJsonSafe(res)) as Partial<AdminTokenPair> | null;
  if (!res.ok || !json?.accessToken || !json?.refreshToken) {
    logAdminApiFailure(method, url, res.status, json);
    throw new AdminApiError(messageFromBody(json), res.status, json, url, method);
  }
  return { accessToken: json.accessToken, refreshToken: json.refreshToken };
}

/** Public refresh used on app load when access is missing but refresh exists */
export async function tryRefreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const pair = await refreshTokens(refreshToken);
    setTokens(pair.accessToken, pair.refreshToken);
    return true;
  } catch {
    clearAuthStorage();
    return false;
  }
}
