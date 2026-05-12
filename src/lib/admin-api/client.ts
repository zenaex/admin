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
  const b = body as ApiErrorBody;
  if (typeof b.message === "string" && b.message) return b.message;
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
  const { auth = true, _retry = false, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (!headers.has("Content-Type") && rest.body && !(rest.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const access = getAccessToken();
    if (access) headers.set("Authorization", `Bearer ${access}`);
  }

  const url = adminUrl(path);
  const method = (rest.method ?? "GET").toString().toUpperCase();
  const res = await fetch(url, { ...rest, headers, credentials: "omit" });
  const body = await parseJsonSafe(res);

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
    logAdminApiFailure(method, url, res.status, body);
    throw new AdminApiError(messageFromBody(body), res.status, body, url, method);
  }

  return body as T;
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
