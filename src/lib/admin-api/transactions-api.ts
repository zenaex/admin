import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminTransactionListQuery,
  AdminTransactionListResult,
  AdminTransactionListRow,
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

function extractItemsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  const inner =
    r.data ??
    r.items ??
    r.results ??
    r.transactions ??
    r.rows ??
    r.records ??
    r.list;
  if (Array.isArray(inner)) return inner;
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested = dataInner.items ?? dataInner.transactions ?? dataInner.results ?? dataInner.rows;
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

function listQueryToParams(query: AdminTransactionListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    channel: query.channel,
    type: query.type ?? query.channel,
    fromDate: query.fromDate,
    toDate: query.toDate,
  };
}

export function normalizeTransactionRow(raw: unknown): AdminTransactionListRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const referenceNo =
    pickString(o, ["reference", "referenceNo", "reference_number", "refNo", "ref"]) ||
    pickString(o, ["id", "transactionId", "txId"]) ||
    "";
  if (!referenceNo) return null;

  const amountNum = pickNum(o, ["amount", "value", "totalAmount"]);
  const currency = pickString(o, ["currency", "asset"]) || "";
  const amount =
    amountNum !== undefined
      ? `${currency ? `${currency} ` : "₦"}${amountNum.toLocaleString()}`.replace(/^₦₦/, "₦")
      : pickString(o, ["amountFormatted", "amount_display", "formattedAmount"]) || "—";

  const channel =
    pickString(o, ["channel", "type", "category", "transactionType", "productType"]) || "—";
  const provider =
    pickString(o, ["provider", "biller", "merchant", "vendor", "description"]) || "—";
  const statusRaw = pickString(o, ["status", "state"]) || "—";
  const status = humanizeStatus(statusRaw);
  const dateRaw =
    pickString(o, ["createdAt", "created_at", "date", "timestamp", "completedAt"]) || "";
  const customerName =
    pickString(o, ["customerName", "customer_name", "userName", "name", "accountName"]) || "—";

  return {
    id: referenceNo,
    refNo: referenceNo,
    customerName,
    channel,
    amount,
    provider,
    status,
    date: dateRaw ? formatDisplayDate(dateRaw) : "—",
    dateSortKey: dateRaw,
    raw: o,
  };
}

export function normalizeTransactionListResponse(
  data: unknown,
  requestedPage: number,
  requestedPageSize: number,
): AdminTransactionListResult {
  const itemsRaw = extractItemsArray(data);
  const items = itemsRaw.map(normalizeTransactionRow).filter((x): x is AdminTransactionListRow => x !== null);
  const total = extractTotal(data, items.length);
  const { page, pageSize } = extractPageInfo(data, requestedPage, requestedPageSize);
  return { items, total, page, pageSize };
}

export async function getAdminTransactionsList(
  query?: AdminTransactionListQuery,
): Promise<AdminTransactionListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery(listQueryToParams({ ...query, page, pageSize }));
  const body = await adminRequest<unknown>(`/admin/transactions${qs}`, { method: "GET" });
  return normalizeTransactionListResponse(body, page, pageSize);
}

/** Wallet transactions (deposits & withdrawals per OpenAPI). */
export async function getAdminWalletTransactionsList(
  query?: AdminTransactionListQuery,
): Promise<AdminTransactionListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery(listQueryToParams({ ...query, page, pageSize }));
  const body = await adminRequest<unknown>(`/admin/transactions/wallet${qs}`, { method: "GET" });
  return normalizeTransactionListResponse(body, page, pageSize);
}

export async function getAdminTransactionDetail(reference: string): Promise<Record<string, unknown>> {
  const data = await adminRequest<unknown>(`/admin/transactions/${encodeURIComponent(reference)}`, {
    method: "GET",
  });
  const r = asRecord(data);
  if (!r) return {};
  const inner = asRecord(r.data);
  return inner ?? r;
}

/** Merge product + wallet lists for the All tab (client pagination). */
export function mergeTransactionListResults(
  product: AdminTransactionListResult,
  wallet: AdminTransactionListResult,
): AdminTransactionListResult {
  const seen = new Set<string>();
  const merged: AdminTransactionListRow[] = [];
  for (const row of [...product.items, ...wallet.items]) {
    if (seen.has(row.refNo)) continue;
    seen.add(row.refNo);
    merged.push(row);
  }
  merged.sort((a, b) => {
    const ta = a.dateSortKey ? new Date(a.dateSortKey).getTime() : 0;
    const tb = b.dateSortKey ? new Date(b.dateSortKey).getTime() : 0;
    return tb - ta;
  });
  const total = Math.max(product.total, 0) + Math.max(wallet.total, 0);
  return {
    items: merged,
    total: total || merged.length,
    page: 1,
    pageSize: merged.length,
  };
}

export function filterRowsByChannelTab(
  items: AdminTransactionListRow[],
  tab: string,
): AdminTransactionListRow[] {
  if (tab === "All") return items;
  const needle = tab.toLowerCase().replace(/[^a-z0-9]/g, "");
  return items.filter((row) => {
    const ch = row.channel.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (tab === "E-sim") return ch.includes("esim") || ch.includes("sim");
    if (tab === "E-trade") return ch.includes("etrade") || ch.includes("trade");
    return ch.includes(needle);
  });
}

export function filterWalletTabRows(
  items: AdminTransactionListRow[],
  tab: "Deposit" | "Withdrawal",
): AdminTransactionListRow[] {
  const needle = tab.toLowerCase();
  return items.filter((row) => {
    const ch = row.channel.toLowerCase();
    const type = String(row.raw.type ?? row.raw.transactionType ?? "").toLowerCase();
    return ch.includes(needle) || type.includes(needle);
  });
}

/** Map UI status filter to API query value. */
export function uiStatusToApiStatus(status: string): string | undefined {
  const s = status.toLowerCase();
  if (s.includes("success")) return "successful";
  if (s.includes("pending")) return "pending";
  if (s.includes("fail")) return "failed";
  return status;
}
