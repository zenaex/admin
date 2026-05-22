import { getAdminAuditCustomerLogs as fetchAdminAuditCustomerLogs } from "@/lib/admin-api/audit-api";
import { adminRequest } from "@/lib/admin-api/client";
import { normalizeTransactionListResponse } from "@/lib/admin-api/transactions-api";
import type {
  AdminCustomerListQuery,
  AdminCustomerListResult,
  AdminCustomerListRow,
  AdminCustomersSummary,
  AdminCustomerTransactionListResult,
  AdminCustomerTransactionRow,
  AdminCustomerWalletItem,
  AdminCustomerWalletsResponse,
} from "@/lib/admin-api/types";

function pickString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNum(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function getAdminCustomersSummary(query?: { fromDate?: string; toDate?: string }): Promise<AdminCustomersSummary> {
  const qs = buildQuery({ fromDate: query?.fromDate, toDate: query?.toDate });
  return adminRequest<AdminCustomersSummary>(`/admin/customers/summary${qs}`, { method: "GET" });
}

function firstArrayFromRecord(rec: Record<string, unknown>): unknown[] | null {
  for (const key of [
    "items",
    "transactions",
    "walletTransactions",
    "wallet_transactions",
    "customers",
    "users",
    "results",
    "rows",
    "records",
    "list",
    "content",
    "data",
  ]) {
    const v = rec[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

function extractItemsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  if (Array.isArray(r.content)) return r.content;

  const fromTop = firstArrayFromRecord(r);
  if (fromTop) return fromTop;

  const inner =
    r.data ??
    r.items ??
    r.results ??
    r.transactions ??
    r.walletTransactions ??
    r.wallet_transactions ??
    r.customers ??
    r.rows ??
    r.records ??
    r.list ??
    r.users;
  if (Array.isArray(inner)) return inner;

  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested = firstArrayFromRecord(dataInner);
    if (nested) return nested;
  }

  const payloadInner = asRecord(r.payload);
  if (payloadInner) {
    const nested = firstArrayFromRecord(payloadInner);
    if (nested) return nested;
  }
  return [];
}

function extractTotal(data: unknown, fallback: number): number {
  const r = asRecord(data);
  if (!r) return fallback;
  const meta = asRecord(r.meta);
  const dataInner = asRecord(r.data);
  const pagination =
    asRecord(r.pagination) ?? (dataInner ? asRecord(dataInner.pagination) : null);
  const n =
    pickNum(r, ["total", "totalCount", "count", "totalItems", "totalElements"]) ??
    (dataInner
      ? pickNum(dataInner, ["total", "totalCount", "count", "totalItems", "totalElements"])
      : undefined) ??
    (pagination ? pickNum(pagination, ["total", "totalCount", "count", "totalElements"]) : undefined) ??
    (meta ? pickNum(meta, ["total", "totalCount", "count", "totalElements"]) : undefined);
  if (n !== undefined && n >= 0) return n;
  return fallback;
}

function extractPageInfo(data: unknown, requestedPage: number, requestedPageSize: number) {
  const r = asRecord(data);
  const meta = r ? asRecord(r.meta) : null;
  const dataInner = r ? asRecord(r.data) : null;
  const pagination =
    (r ? asRecord(r.pagination) : null) ?? (dataInner ? asRecord(dataInner.pagination) : null);
  const page =
    pickNum(r ?? {}, ["page", "currentPage"]) ??
    (dataInner ? pickNum(dataInner, ["page", "currentPage"]) : undefined) ??
    (pagination ? pickNum(pagination, ["page", "currentPage"]) : undefined) ??
    (meta ? pickNum(meta, ["page", "currentPage"]) : undefined) ??
    requestedPage;
  const pageSize =
    pickNum(r ?? {}, ["pageSize", "limit", "perPage"]) ??
    (dataInner ? pickNum(dataInner, ["pageSize", "limit", "perPage"]) : undefined) ??
    (pagination ? pickNum(pagination, ["pageSize", "limit", "perPage"]) : undefined) ??
    (meta ? pickNum(meta, ["pageSize", "limit", "perPage"]) : undefined) ??
    requestedPageSize;
  return { page, pageSize };
}

function formatDisplayDate(isoOrAny: string): string {
  if (!isoOrAny) return "—";
  const d = new Date(isoOrAny);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return isoOrAny;
}

function humanizeStatus(s: string): string {
  if (!s) return "—";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function normalizeCustomerRow(raw: unknown): AdminCustomerListRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const accountId =
    pickString(o, ["accountId", "id", "uuid", "userId", "customerId"]) ||
    (typeof o.account_id === "string" ? o.account_id : "");
  if (!accountId) return null;

  const first = pickString(o, ["firstName", "first_name", "givenName"]);
  const last = pickString(o, ["lastName", "last_name", "familyName"]);
  const full = [first, last].filter(Boolean).join(" ").trim();
  const name =
    full ||
    pickString(o, ["fullName", "full_name", "name", "displayName", "customerName"]) ||
    pickString(o, ["email"]) ||
    accountId;

  const username =
    pickString(o, ["username", "userName", "handle"]) ||
    (pickString(o, ["email"]).includes("@") ? `@${pickString(o, ["email"]).split("@")[0]}` : "—");

  const email = pickString(o, ["email", "emailAddress"]);
  const phone = pickString(o, ["phone", "phoneNumber", "mobile", "msisdn"]);

  const statusRaw =
    pickString(o, ["accountStatus", "account_status", "status", "userStatus"]) ||
    (typeof o.accountStatus === "string" ? o.accountStatus : "");
  const statusLabel = statusRaw ? humanizeStatus(statusRaw) : "—";

  const dateRaw =
    pickString(o, ["createdAt", "created_at", "dateOnboarded", "onboardedAt", "signupDate"]) ||
    (typeof o.createdAt === "string" ? o.createdAt : "");
  const dateOnboarded = dateRaw ? formatDisplayDate(dateRaw) : "—";

  return {
    accountId,
    name,
    username: username.startsWith("@") ? username : username !== "—" ? `@${username}` : "—",
    email: email || "—",
    phone: phone || "—",
    statusLabel,
    dateOnboarded,
    raw: o,
  };
}

export function normalizeCustomerListResponse(data: unknown, requestedPage: number, requestedPageSize: number): AdminCustomerListResult {
  const itemsRaw = extractItemsArray(data);
  const items = itemsRaw.map(normalizeCustomerRow).filter((x): x is AdminCustomerListRow => x !== null);
  const total = extractTotal(data, items.length);
  const { page, pageSize } = extractPageInfo(data, requestedPage, requestedPageSize);
  return { items, total, page, pageSize };
}

export async function getAdminCustomersList(query: AdminCustomerListQuery): Promise<AdminCustomerListResult> {
  const page = query.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const qs = buildQuery({
    page,
    pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    accountStatus: query.accountStatus === "" ? undefined : query.accountStatus,
    activityStatus: query.activityStatus === "" ? undefined : query.activityStatus,
    kycTier: query.kycTier === 0 ? undefined : query.kycTier,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });
  const body = await adminRequest<unknown>(`/admin/customers${qs}`, { method: "GET" });
  return normalizeCustomerListResponse(body, page, pageSize);
}

/** Full customer profile — shape varies; consumers pick fields defensively. */
export async function getAdminCustomerProfile(accountId: string): Promise<Record<string, unknown>> {
  const data = await adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}`, { method: "GET" });
  const r = asRecord(data);
  if (!r) return {};
  const inner =
    asRecord(r.data) ?? asRecord(r.customer) ?? asRecord(r.profile) ?? asRecord(r.account);
  return inner ?? r;
}

/** Map API password status (boolean or `passwordStatus` string) to Set / Not Set. */
export function passwordStatusToSet(value: unknown): "Set" | "Not Set" {
  if (value === true || value === 1) return "Set";
  if (value === false || value === 0) return "Not Set";
  if (typeof value === "string") {
    const s = value.trim().toLowerCase().replace(/-/g, "_");
    if (!s) return "Not Set";
    if (s === "set" || s === "configured" || s === "enabled" || s === "active" || s === "yes" || s === "true") {
      return "Set";
    }
    if (
      s === "not_set" ||
      s === "notset" ||
      s === "unset" ||
      s === "disabled" ||
      s === "no" ||
      s === "false" ||
      (s.includes("not") && s.includes("set"))
    ) {
      return "Not Set";
    }
    if (s.includes("set")) return "Set";
  }
  return "Not Set";
}

export function pickCustomerPasswordStatus(profile: Record<string, unknown>): "Set" | "Not Set" {
  const raw =
    profile.passwordStatus ??
    profile.password_status ??
    profile.passwordSet ??
    profile.password_set ??
    profile.hasPassword ??
    profile.isPasswordSet ??
    profile.passcodeSet ??
    profile.passcode_is_set ??
    profile.hasPasscode;
  return passwordStatusToSet(raw);
}

export async function getAdminCustomerKyc(accountId: string): Promise<unknown> {
  return adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}/kyc`, { method: "GET" });
}

export type AdminCustomerTransactionsQuery = {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  /** Used when transaction rows omit customer name (common on per-customer history). */
  customerDisplayName?: string;
};

function mapTransactionRowToCustomerRow(
  row: ReturnType<typeof normalizeTransactionListResponse>["items"][number],
  customerDisplayName?: string,
): AdminCustomerTransactionRow {
  const fallbackName = customerDisplayName?.trim();
  const customerName =
    row.customerName === "—" && fallbackName ? fallbackName : row.customerName;
  return {
    id: row.id,
    referenceNo: row.refNo,
    customerName,
    channel: row.channel,
    amount: row.amount,
    biller: row.provider,
    status: row.status,
    date: row.date,
  };
}

export async function getAdminCustomerTransactions(
  accountId: string,
  query?: AdminCustomerTransactionsQuery,
): Promise<AdminCustomerTransactionListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery({
    page,
    pageSize,
    fromDate: query?.fromDate,
    toDate: query?.toDate,
  });
  const body = await adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}/transactions${qs}`, {
    method: "GET",
  });
  const normalized = normalizeTransactionListResponse(body, page, pageSize);
  const displayName = query?.customerDisplayName?.trim();
  return {
    items: normalized.items.map((row) => mapTransactionRowToCustomerRow(row, displayName)),
    total: normalized.total,
    page: normalized.page,
    pageSize: normalized.pageSize,
  };
}

export async function getAdminCustomerWallets(accountId: string): Promise<AdminCustomerWalletsResponse> {
  const data = await adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}/wallets`, { method: "GET" });
  const r = asRecord(data);
  if (!r) return {};
  const walletsRaw = r.wallets;
  const wallets = Array.isArray(walletsRaw)
    ? walletsRaw.map((w) => (asRecord(w) ?? {}) as AdminCustomerWalletItem)
    : undefined;
  return {
    wallets,
    totalCount: pickNum(r, ["totalCount", "total"]),
    nextPageToken: pickString(r, ["nextPageToken", "next_page_token"]) || undefined,
  };
}

/** Returns raw log objects for customer detail audit tab (see `audit-api` for normalized entries). */
export async function getAdminAuditCustomerLogs(accountId: string): Promise<Record<string, unknown>[]> {
  const { logs } = await fetchAdminAuditCustomerLogs(accountId);
  return logs.map((l) => l.raw);
}
