import { adminRequest } from "@/lib/admin-api/client";
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

function extractItemsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  const inner =
    r.data ?? r.items ?? r.results ?? r.customers ?? r.rows ?? r.records ?? r.list ?? r.users;
  if (Array.isArray(inner)) return inner;
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested =
      dataInner.items ??
      dataInner.customers ??
      dataInner.results ??
      dataInner.rows;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function extractTotal(data: unknown, fallback: number): number {
  const r = asRecord(data);
  if (!r) return fallback;
  const meta = asRecord(r.meta);
  const n =
    pickNum(r, ["total", "totalCount", "count", "totalItems"]) ??
    (meta ? pickNum(meta, ["total", "totalCount", "count"]) : undefined);
  if (n !== undefined && n >= 0) return n;
  return fallback;
}

function extractPageInfo(data: unknown, requestedPage: number, requestedPageSize: number) {
  const r = asRecord(data);
  const meta = r ? asRecord(r.meta) : null;
  const page =
    pickNum(r ?? {}, ["page", "currentPage"]) ??
    (meta ? pickNum(meta, ["page", "currentPage"]) : undefined) ??
    requestedPage;
  const pageSize =
    pickNum(r ?? {}, ["pageSize", "limit", "perPage"]) ??
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
  return r ?? {};
}

export async function getAdminCustomerKyc(accountId: string): Promise<unknown> {
  return adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}/kyc`, { method: "GET" });
}

export type AdminCustomerTransactionsQuery = {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
};

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
  const itemsRaw = extractItemsArray(body);
  const items: AdminCustomerTransactionRow[] = itemsRaw
    .map((row, idx) => {
      const o = asRecord(row);
      if (!o) return null;
      const id = pickString(o, ["id", "transactionId", "txId"]) || `tx-${idx}`;
      const referenceNo = pickString(o, ["reference", "referenceNo", "reference_number"]) || id;
      const amountNum = pickNum(o, ["amount", "value", "totalAmount"]);
      const currency = pickString(o, ["currency", "asset"]) || "";
      const amount =
        amountNum !== undefined
          ? `${currency ? `${currency} ` : ""}${amountNum.toLocaleString()}`.trim()
          : pickString(o, ["amountFormatted", "amount_display"]) || "—";
      const channel = pickString(o, ["channel", "type", "category", "transactionType"]) || "—";
      const biller = pickString(o, ["biller", "provider", "merchant", "description"]) || "—";
      const statusRaw = pickString(o, ["status", "state"]) || "—";
      const status = humanizeStatus(statusRaw);
      const dateRaw = pickString(o, ["createdAt", "created_at", "date", "timestamp"]) || "";
      const customerName = pickString(o, ["customerName", "customer_name", "userName", "name"]) || "—";
      return {
        id,
        referenceNo,
        customerName,
        channel,
        amount,
        biller,
        status,
        date: dateRaw ? formatDisplayDate(dateRaw) : "—",
      };
    })
    .filter((x): x is AdminCustomerTransactionRow => x !== null);

  const total = extractTotal(body, items.length);
  const { page: p, pageSize: ps } = extractPageInfo(body, page, pageSize);
  return { items, total, page: p, pageSize: ps };
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

export function normalizeAuditCustomerLogs(data: unknown): Record<string, unknown>[] {
  const arr = extractItemsArray(data);
  return arr.map((x) => asRecord(x) ?? {}).filter((o) => Object.keys(o).length > 0);
}

export async function getAdminAuditCustomerLogs(accountId: string): Promise<Record<string, unknown>[]> {
  const data = await adminRequest<unknown>(`/admin/audit/customers/${encodeURIComponent(accountId)}/logs`, {
    method: "GET",
  });
  return normalizeAuditCustomerLogs(data);
}
