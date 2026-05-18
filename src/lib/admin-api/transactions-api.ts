import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminTransactionListQuery,
  AdminTransactionListResult,
  AdminTransactionListRow,
  AdminTransactionsSummary,
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
  if (Array.isArray(r.content)) return r.content;
  const inner =
    r.data ??
    r.items ??
    r.results ??
    r.transactions ??
    r.rows ??
    r.records ??
    r.list ??
    r.payload;
  if (Array.isArray(inner)) return inner;
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested =
      dataInner.items ??
      dataInner.transactions ??
      dataInner.results ??
      dataInner.rows ??
      dataInner.records ??
      dataInner.list ??
      dataInner.content;
    if (Array.isArray(nested)) return nested;
  }
  const payloadInner = asRecord(r.payload);
  if (payloadInner) {
    const nested = payloadInner.items ?? payloadInner.transactions ?? payloadInner.results;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function extractTotal(data: unknown, fallback: number): number {
  const r = asRecord(data);
  if (!r) return fallback;
  const meta = asRecord(r.meta);
  const n =
    pickNum(r, ["total", "totalCount", "count", "totalItems", "totalElements"]) ??
    (meta ? pickNum(meta, ["total", "totalCount", "count", "totalElements"]) : undefined);
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
    const datePart = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${datePart} | ${timePart}`;
  }
  return isoOrAny;
}

function pickNestedString(o: Record<string, unknown>, paths: string[][]): string {
  for (const path of paths) {
    let cur: unknown = o;
    for (const key of path) {
      const rec = asRecord(cur);
      if (!rec) {
        cur = null;
        break;
      }
      cur = rec[key];
    }
    if (typeof cur === "string" && cur.trim()) return cur.trim();
    if (typeof cur === "number" && Number.isFinite(cur)) return String(cur);
  }
  return "";
}

function pickNestedRecord(o: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
  for (const k of keys) {
    const nested = asRecord(o[k]);
    if (nested) return nested;
  }
  return null;
}

function humanizeStatus(s: string): string {
  if (!s) return "—";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function humanizeLabel(s: string): string {
  if (!s) return "—";
  if (/\s/.test(s)) return s.trim();
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatPersonName(rec: Record<string, unknown>): string {
  const first = pickString(rec, [
    "firstName",
    "first_name",
    "givenName",
    "userFirstName",
    "user_first_name",
    "customerFirstName",
    "customer_first_name",
  ]);
  const last = pickString(rec, [
    "lastName",
    "last_name",
    "familyName",
    "userLastName",
    "user_last_name",
    "customerLastName",
    "customer_last_name",
  ]);
  const fromParts = [first, last].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;

  return (
    pickString(rec, [
      "fullName",
      "full_name",
      "name",
      "displayName",
      "customerName",
      "customer_name",
      "accountName",
      "userName",
    ]) ||
    pickString(rec, ["username", "handle"]) ||
    pickString(rec, ["email", "emailAddress"]) ||
    ""
  );
}

const PROVIDER_SCAN_SKIP = new Set([
  "description",
  "note",
  "notes",
  "memo",
  "reference",
  "referenceno",
  "email",
  "status",
  "channel",
  "type",
  "currency",
  "amount",
  "customername",
  "firstname",
  "lastname",
]);

function keyLooksLikeProviderField(key: string): boolean {
  const lower = key.toLowerCase();
  if (PROVIDER_SCAN_SKIP.has(lower)) return false;
  if (lower.endsWith("id") && !lower.includes("name") && lower !== "providercode") return false;
  return /provider|biller|merchant|vendor|gateway|processor|aggregator|partner|switchprovider|route|platform/.test(
    lower,
  );
}

function scanForProviderLabel(root: Record<string, unknown>, depth = 0): string {
  if (depth > 4) return "";

  for (const [key, val] of Object.entries(root)) {
    if (!keyLooksLikeProviderField(key)) continue;

    if (typeof val === "string" && val.trim()) {
      const s = val.trim();
      if (s.length < 120 && !/^[0-9a-f-]{36}$/i.test(s)) return humanizeLabel(s);
    }

    const rec = asRecord(val);
    if (rec) {
      const nested = pickString(rec, [
        "name",
        "providerName",
        "provider_name",
        "billerName",
        "label",
        "code",
        "slug",
        "title",
      ]);
      if (nested) return humanizeLabel(nested);
    }
  }

  for (const val of Object.values(root)) {
    const rec = asRecord(val);
    if (rec) {
      const found = scanForProviderLabel(rec, depth + 1);
      if (found) return found;
    }
  }
  return "";
}

function pickProviderLabel(o: Record<string, unknown>): string {
  const directProvider = o.provider;
  if (typeof directProvider === "string" && directProvider.trim()) {
    return humanizeLabel(directProvider);
  }
  if (directProvider && typeof directProvider === "object") {
    const rec = asRecord(directProvider);
    if (rec) {
      const fromObj = pickString(rec, ["name", "providerName", "label", "code", "slug", "title"]);
      if (fromObj) return humanizeLabel(fromObj);
    }
  }

  const providerBlock = pickNestedRecord(o, [
    "provider",
    "providerDetails",
    "providerInfo",
    "biller",
    "merchant",
    "vendor",
    "product",
    "payment",
    "service",
    "integration",
    "processor",
    "partner",
    "gateway",
  ]);

  const fromTop = pickString(o, [
    "providerName",
    "provider_name",
    "billerName",
    "biller_name",
    "merchantName",
    "merchant_name",
    "vendorName",
    "vendor_name",
    "serviceProvider",
    "service_provider",
    "paymentProvider",
    "payment_provider",
    "processorName",
    "processor_name",
    "partnerName",
    "partner_name",
    "gateway",
    "aggregator",
    "network",
    "bankName",
    "bank_name",
    "biller",
    "merchant",
    "vendor",
    "switchProvider",
    "switch_provider",
    "route",
    "routeName",
    "route_name",
    "platform",
    "source",
    "sourceProvider",
    "externalProvider",
    "fulfillmentProvider",
    "giftcardProvider",
    "cryptoProvider",
    "utilityProvider",
    "vasProvider",
    "billProvider",
    "paymentPartner",
    "integrationProvider",
    "apiProvider",
    "serviceName",
    "productProvider",
    "transactionProvider",
    "transaction_provider",
  ]);

  const fromNested = pickNestedString(o, [
    ["provider", "name"],
    ["provider", "providerName"],
    ["provider", "label"],
    ["provider", "code"],
    ["providerDetails", "name"],
    ["providerInfo", "name"],
    ["biller", "name"],
    ["biller", "billerName"],
    ["merchant", "name"],
    ["product", "provider"],
    ["product", "providerName"],
    ["product", "name"],
    ["payment", "provider"],
    ["payment", "providerName"],
    ["service", "provider"],
    ["service", "name"],
    ["integration", "name"],
    ["processor", "name"],
    ["partner", "name"],
    ["bank", "name"],
    ["bank", "bankName"],
    ["metadata", "provider"],
    ["meta", "provider"],
    ["details", "provider"],
    ["details", "providerName"],
  ]);

  const fromBlock = providerBlock
    ? pickString(providerBlock, [
        "name",
        "providerName",
        "provider_name",
        "billerName",
        "title",
        "label",
        "displayName",
        "code",
        "slug",
      ])
    : "";

  const scanned = scanForProviderLabel(o);
  const raw = fromTop || fromNested || fromBlock || scanned;
  return raw ? humanizeLabel(raw) : "—";
}

function pickSummaryAmount(o: Record<string, unknown>, keys: string[]): number | string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const data = asRecord(o.data);
  if (data) {
    for (const k of keys) {
      const v = data[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return undefined;
}

function pickSummaryCount(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const n = pickNum(o, [k]);
    if (n !== undefined) return n;
  }
  const data = asRecord(o.data);
  if (data) {
    for (const k of keys) {
      const n = pickNum(data, [k]);
      if (n !== undefined) return n;
    }
  }
  return undefined;
}

export function normalizeTransactionsSummary(data: unknown): AdminTransactionsSummary {
  const r = asRecord(data);
  if (!r) return {};
  const inner = asRecord(r.data) ?? r;

  return {
    totalAmountDeposited: pickSummaryAmount(inner, [
      "totalAmountDeposited",
      "total_amount_deposited",
      "totalDeposited",
      "total_deposited",
      "totalDepositAmount",
      "depositsTotal",
      "depositAmount",
      "totalDeposits",
    ]),
    totalAmountWithdrawn: pickSummaryAmount(inner, [
      "totalAmountWithdrawn",
      "total_amount_withdrawn",
      "totalWithdrawn",
      "total_withdrawn",
      "totalWithdrawalAmount",
      "withdrawalsTotal",
      "withdrawalAmount",
      "totalWithdrawals",
    ]),
    totalTransactions: pickSummaryCount(inner, [
      "totalTransactions",
      "total_transactions",
      "totalTransactionCount",
      "transactionCount",
      "numberOfTransactions",
      "transactionsCount",
      "count",
    ]),
    totalUsers: pickSummaryCount(inner, [
      "totalUsers",
      "total_users",
      "uniqueUsers",
      "unique_users",
      "totalCustomers",
      "userCount",
      "customersCount",
    ]),
  };
}

export async function getAdminTransactionsSummary(query?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AdminTransactionsSummary> {
  const qs = buildQuery({ fromDate: query?.fromDate, toDate: query?.toDate });
  const body = await adminRequest<unknown>(`/admin/transactions/summary${qs}`, { method: "GET" });
  return normalizeTransactionsSummary(body);
}

function productListQueryToParams(query: AdminTransactionListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    channel: query.channel,
    fromDate: query.fromDate,
    toDate: query.toDate,
  };
}

function walletListQueryToParams(query: AdminTransactionListQuery) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    search: query.search,
    status: query.status,
    type: query.type,
    fromDate: query.fromDate,
    toDate: query.toDate,
  };
}

/** Map transactions UI tab label to API `channel` query value. */
export function tabChannelToApiChannel(tab: string): string {
  switch (tab) {
    case "E-sim":
      return "esim";
    case "E-trade":
      return "etrade";
    case "Giftcard":
      return "giftcard";
    case "Crypto":
      return "crypto";
    case "Utility":
      return "utility";
    default:
      return tab;
  }
}

function unwrapTransactionRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = pickNestedRecord(raw, ["transaction", "tx", "payment", "order", "details"]);
  if (!inner) return raw;
  // Top-level fields (user, provider, reference) win over nested shells.
  return { ...inner, ...raw };
}

export function normalizeTransactionRow(raw: unknown, index = 0): AdminTransactionListRow | null {
  const base = asRecord(raw);
  if (!base) return null;
  const o = unwrapTransactionRecord(base);

  const customerBlock = pickNestedRecord(o, [
    "customer",
    "user",
    "account",
    "beneficiary",
    "payer",
    "customerDetails",
    "userDetails",
  ]);
  const amountBlock = pickNestedRecord(o, ["amount", "transactionAmount", "payment"]);

  const referenceNo =
    pickString(o, [
      "reference",
      "referenceNo",
      "reference_number",
      "referenceNumber",
      "transactionReference",
      "refNo",
      "ref",
      "orderId",
      "order_id",
    ]) ||
    pickString(o, ["id", "transactionId", "txId", "uuid"]) ||
    `tx-${index}`;

  const amountNum =
    pickNum(o, ["amount", "value", "totalAmount", "transactionAmount", "amountPaid", "paidAmount"]) ??
    (amountBlock ? pickNum(amountBlock, ["value", "amount", "total", "paid"]) : undefined);
  const currency =
    pickString(o, ["currency", "asset", "currencyCode"]) ||
    (amountBlock ? pickString(amountBlock, ["currency", "code"]) : "") ||
    "";
  const amount =
    amountNum !== undefined
      ? `${currency ? `${currency} ` : "₦"}${amountNum.toLocaleString()}`.replace(/^₦₦/, "₦")
      : pickString(o, ["amountFormatted", "amount_display", "formattedAmount"]) ||
        (amountBlock ? pickString(amountBlock, ["formatted", "display"]) : "") ||
        "—";

  const channel =
    pickString(o, [
      "channel",
      "productChannel",
      "product_channel",
      "category",
      "transactionType",
      "transaction_type",
      "productType",
      "product_type",
      "service",
    ]) ||
    pickString(o, ["type"]) ||
    "—";
  const provider = pickProviderLabel(o);
  const statusRaw =
    pickString(o, ["status", "state", "outcome", "transactionStatus", "paymentStatus"]) || "—";
  const status = humanizeStatus(statusRaw);
  const dateRaw =
    pickString(o, [
      "createdAt",
      "created_at",
      "date",
      "timestamp",
      "completedAt",
      "completed_at",
      "initiatedAt",
      "updatedAt",
    ]) || "";
  const customerName =
    pickString(o, ["customerName", "customer_name"]) ||
    pickNestedString(o, [
      ["customer", "name"],
      ["customer", "fullName"],
      ["user", "name"],
      ["user", "fullName"],
      ["account", "name"],
      ["account", "accountName"],
      ["beneficiary", "name"],
    ]) ||
    (customerBlock ? formatPersonName(customerBlock) : "") ||
    formatPersonName(o) ||
    "—";

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
  const items = itemsRaw
    .map((raw, idx) => normalizeTransactionRow(raw, idx))
    .filter((x): x is AdminTransactionListRow => x !== null);
  const total = extractTotal(data, items.length);
  const { page, pageSize } = extractPageInfo(data, requestedPage, requestedPageSize);
  return { items, total, page, pageSize };
}

export async function getAdminTransactionsList(
  query?: AdminTransactionListQuery,
): Promise<AdminTransactionListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery(productListQueryToParams({ ...query, page, pageSize }));
  const body = await adminRequest<unknown>(`/admin/transactions${qs}`, { method: "GET" });
  return normalizeTransactionListResponse(body, page, pageSize);
}

/** Wallet transactions (deposits & withdrawals per OpenAPI). */
export async function getAdminWalletTransactionsList(
  query?: AdminTransactionListQuery,
): Promise<AdminTransactionListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery(walletListQueryToParams({ ...query, page, pageSize }));
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
