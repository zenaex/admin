import { adminRequest } from "@/lib/admin-api/client";
import {
  giftcardMocksEnabled,
  getGiftcardMockDetail,
  getGiftcardMockLogs,
  isGiftcardMockReference,
  mergeGiftcardMockTransactions,
} from "@/lib/admin-api/giftcard-mock-transactions";
import {
  formatDataBundleDisplay,
  normalizeTransactionLogList,
  readDataBundleRaw,
  type TransactionLogEntry,
} from "@/lib/admin-api/transaction-detail-mapper";
import {
  formatKoboAmountDisplay,
  koboSummaryToMajor,
  koboToMajor,
  pickKobo,
} from "@/lib/admin-api/money";
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

function firstArrayFromRecord(rec: Record<string, unknown>): unknown[] | null {
  for (const key of [
    "items",
    "transactions",
    "walletTransactions",
    "wallet_transactions",
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
    r.rows ??
    r.records ??
    r.list ??
    r.payload;
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
  if (!s || s === "—") return "—";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const DATE_FIELD_KEYS = [
  "createdAt",
  "created_at",
  "createdOn",
  "created_on",
  "date",
  "timestamp",
  "transactionTimestamp",
  "transaction_timestamp",
  "transactionTime",
  "transaction_time",
  "transactionDate",
  "transaction_date",
  "dateCreated",
  "date_created",
  "completedAt",
  "completed_at",
  "initiatedAt",
  "initiated_at",
  "updatedAt",
  "updated_at",
  "executedAt",
  "executed_at",
  "processedAt",
  "processed_at",
  "postedAt",
  "posted_at",
  "eventTime",
  "event_time",
  "occurredAt",
  "occurred_at",
  "time",
  "created",
  "updated",
  "completed",
  "initiated",
];

function parseDateInput(v: unknown): Date | null {
  if (v == null) return null;
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return d;
    const ymd = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymd) {
      const parsed = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const ms = v > 1e12 ? v : v > 1e9 ? v * 1000 : v;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      const d = parseDateInput(item);
      if (d) return d;
    }
    return null;
  }
  const rec = asRecord(v);
  if (rec) {
    for (const k of ["$date", "date", "iso", "value", "utc", "timestamp", "at", "datetime"]) {
      const d = parseDateInput(rec[k]);
      if (d) return d;
    }
  }
  return null;
}

/** ZEN/CRG references often embed YYYYMMDD when the API omits createdAt on list rows. */
export function parseDateFromReference(reference: string): string {
  const ref = reference.trim();
  if (!ref) return "";
  const m = ref.match(/(?:CRG-)?ZEN(\d{4})(\d{2})(\d{2})/i) ?? ref.match(/(\d{4})(\d{2})(\d{2})/);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (mo < 1 || mo > 12 || day < 1 || day > 31) return "";
  const d = new Date(y, mo - 1, day, 12, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function readDateRawFromRecord(o: Record<string, unknown>): string {
  for (const k of DATE_FIELD_KEYS) {
    const parsed = parseDateInput(o[k]);
    if (parsed) return parsed.toISOString();
  }

  for (const [key, val] of Object.entries(o)) {
    if (!/date|time|timestamp|created|updated|completed|initiated|executed|processed|posted|occurred/i.test(key)) {
      continue;
    }
    const parsed = parseDateInput(val);
    if (parsed) return parsed.toISOString();
  }

  const dateOnly = pickString(o, ["date", "transactionDate", "transaction_date"]);
  const timeOnly = pickString(o, ["time", "transactionTime", "transaction_time"]);
  if (dateOnly) {
    const combined = timeOnly ? `${dateOnly}T${timeOnly}` : dateOnly;
    const parsed = parseDateInput(combined);
    if (parsed) return parsed.toISOString();
  }

  return "";
}

function scanNestedDateBlocks(o: Record<string, unknown>, depth = 0): string {
  if (depth > 3) return "";

  for (const blockKey of [
    "timestamps",
    "timeStamps",
    "timestamp",
    "dates",
    "timing",
    "audit",
    "timeline",
    "metadata",
    "meta",
  ]) {
    const block = asRecord(o[blockKey]);
    if (block) {
      const found = readDateRawFromRecord(block);
      if (found) return found;
    }
  }

  for (const val of Object.values(o)) {
    const rec = asRecord(val);
    if (!rec) continue;
    const found = readDateRawFromRecord(rec);
    if (found) return found;
    if (depth < 2) {
      const deep = scanNestedDateBlocks(rec, depth + 1);
      if (deep) return deep;
    }
  }

  return "";
}

function statusFromValue(v: unknown): string {
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    if (/^\d+$/.test(t)) return statusFromValue(Number(t));
    return t;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const mapped: Record<number, string> = {
      0: "pending",
      1: "pending",
      2: "successful",
      3: "failed",
      4: "cancelled",
      5: "reversed",
    };
    if (mapped[v] !== undefined) return mapped[v];
    return String(v);
  }
  if (typeof v === "boolean") return v ? "successful" : "failed";
  const rec = asRecord(v);
  if (rec) {
    return (
      pickString(rec, ["name", "label", "code", "value", "status", "state"]) ||
      statusFromValue(rec.code ?? rec.id)
    );
  }
  return "";
}

function inferStatusFromFlags(o: Record<string, unknown>): string {
  if (o.successful === true || o.isSuccessful === true || o.isSuccess === true) return "successful";
  if (o.failed === true || o.isFailed === true || o.isFailure === true) return "failed";
  if (o.pending === true || o.isPending === true) return "pending";
  if (o.completed === true || o.isCompleted === true) return "successful";
  return "";
}

export function readStatusRaw(o: Record<string, unknown>): string {
  const inferred = inferStatusFromFlags(o);
  if (inferred) return inferred;

  const keys = [
    "status",
    "state",
    "outcome",
    "transactionStatus",
    "transaction_status",
    "paymentStatus",
    "payment_status",
    "walletStatus",
    "wallet_status",
    "processingStatus",
    "approvalStatus",
    "result",
  ];

  for (const k of keys) {
    const s = statusFromValue(o[k]);
    if (s) return s;
  }

  for (const [key, val] of Object.entries(o)) {
    if (!/status|state|outcome|result/i.test(key)) continue;
    const s = statusFromValue(val);
    if (s) return s;
  }

  const meta = asRecord(o.metadata) ?? asRecord(o.meta);
  if (meta) {
    for (const k of keys) {
      const s = statusFromValue(meta[k]);
      if (s) return s;
    }
  }
  return "";
}

export function readDateRaw(o: Record<string, unknown>): string {
  const direct = readDateRawFromRecord(o);
  if (direct) return direct;
  return scanNestedDateBlocks(o);
}

function humanizeLabel(s: string): string {
  if (!s) return "—";
  if (/\s/.test(s)) return s.trim();
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function readChannelRaw(o: Record<string, unknown>): string {
  return (
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
    ""
  );
}

function pickTransactionChannel(o: Record<string, unknown>): string {
  const productLikeChannel = pickString(o, [
    "productChannel",
    "product_channel",
    "category",
    "categorySlug",
    "category_slug",
    "service",
    "productType",
    "product_type",
    "transactionType",
    "transaction_type",
  ]);
  const raw = productLikeChannel || readChannelRaw(o);
  return raw ? humanizeLabel(raw) : "—";
}

function pickTransactionProduct(o: Record<string, unknown>, channelLabel: string): string {
  const dataBundle = readDataBundleRaw(o);
  if (dataBundle) {
    return formatDataBundleDisplay(dataBundle);
  }

  const productSlug = pickString(o, ["productSlug", "product_slug"]);
  const slugKey = productSlug.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    slugKey === "withdrawal" ||
    slugKey === "withdraw" ||
    slugKey === "deposit" ||
    slugKey === "wallet"
  ) {
    return "—";
  }

  const raw =
    pickString(o, ["product", "productName", "product_name", "productSlug", "product_slug"]) ||
    pickNestedString(o, [["product", "name"], ["product", "slug"]]);
  if (!raw) return "—";

  if (/\d+(\.\d+)?gb/i.test(raw) && /\d+d/i.test(raw)) {
    return formatDataBundleDisplay(raw);
  }

  const label = humanizeLabel(raw);
  const channelKeyNorm = channelLabel.toLowerCase().replace(/[^a-z0-9]/g, "");
  const labelKey = label.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (channelKeyNorm && labelKey === channelKeyNorm) return "—";

  return label;
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

function pickAmountValue(v: unknown): number | string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "") return undefined;
    if (Number.isFinite(Number(t))) return Number(t);
    return t;
  }
  return undefined;
}

function pickSummaryAmount(o: Record<string, unknown>, keys: string[]): number | string | undefined {
  for (const k of keys) {
    const picked = pickAmountValue(o[k]);
    if (picked !== undefined) return koboSummaryToMajor(picked);
  }
  const data = asRecord(o.data);
  if (data) {
    for (const k of keys) {
      const picked = pickAmountValue(data[k]);
      if (picked !== undefined) return koboSummaryToMajor(picked);
    }
  }
  return undefined;
}

const SUMMARY_AMOUNT_BLOCK_KEYS = [
  "totalAmount",
  "total_amount",
  "amount",
  "total",
  "sum",
  "value",
  "volume",
  "totalValue",
  "total_value",
];

function pickSummaryAmountFromBlock(block: Record<string, unknown> | null): number | string | undefined {
  if (!block) return undefined;
  for (const k of SUMMARY_AMOUNT_BLOCK_KEYS) {
    const picked = pickAmountValue(block[k]);
    if (picked !== undefined) return koboSummaryToMajor(picked);
  }
  return undefined;
}

function normalizeCategorySlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function slugMatchesCategory(slug: string, target: string): boolean {
  const s = normalizeCategorySlug(slug);
  const t = normalizeCategorySlug(target);
  return s === t || s.includes(t) || t.includes(s);
}

function pickSummaryByCategorySlug(
  root: Record<string, unknown>,
  targetSlug: string,
): number | string | undefined {
  for (const key of [
    "byCategory",
    "by_category",
    "categories",
    "categoryBreakdown",
    "category_breakdown",
    "breakdown",
    "summaryByCategory",
  ]) {
    const arr = root[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const rec = asRecord(item);
      if (!rec) continue;
      const slug = pickString(rec, [
        "categorySlug",
        "category_slug",
        "slug",
        "category",
        "type",
        "name",
      ]);
      if (!slug || !slugMatchesCategory(slug, targetSlug)) continue;
      const fromBlock = pickSummaryAmountFromBlock(rec);
      if (fromBlock !== undefined) return fromBlock;
      const flat = pickSummaryAmount(rec, SUMMARY_AMOUNT_BLOCK_KEYS);
      if (flat !== undefined) return flat;
    }
  }
  return undefined;
}

function pickWalletSummarySide(
  root: Record<string, unknown>,
  side: "deposit" | "withdrawal",
): number | string | undefined {
  const wallet = asRecord(root.wallet) ?? asRecord(root.walletSummary) ?? asRecord(root.wallet_summary);
  const pluralKey = side === "deposit" ? "deposits" : "withdrawals";
  const singularKey = side === "deposit" ? "deposit" : "withdrawal";

  const fromRoot =
    pickSummaryAmountFromBlock(asRecord(root[pluralKey])) ??
    pickSummaryAmountFromBlock(asRecord(root[singularKey]));
  if (fromRoot !== undefined) return fromRoot;

  if (wallet) {
    const fromWallet =
      pickSummaryAmountFromBlock(asRecord(wallet[pluralKey])) ??
      pickSummaryAmountFromBlock(asRecord(wallet[singularKey]));
    if (fromWallet !== undefined) return fromWallet;
  }

  return pickSummaryByCategorySlug(root, side);
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

/** Legacy `*Cents` keys — values are kobo, same as other amount fields. */
function pickSummaryCentsAsMajor(o: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const n = pickKobo(o, [k]);
    if (n !== undefined) return koboToMajor(n);
  }
  const data = asRecord(o.data);
  if (data) {
    for (const k of keys) {
      const n = pickKobo(data, [k]);
      if (n !== undefined) return koboToMajor(n);
    }
  }
  return undefined;
}

export function normalizeTransactionsSummary(data: unknown): AdminTransactionsSummary {
  const r = asRecord(data);
  if (!r) return {};
  const inner = asRecord(r.data) ?? r;

  const depositedNested = pickWalletSummarySide(inner, "deposit");
  const withdrawnNested = pickWalletSummarySide(inner, "withdrawal");

  const depositedCents = pickSummaryCentsAsMajor(inner, [
    "totalDepositedCents",
    "total_deposited_cents",
    "totalDepositCents",
    "total_deposit_cents",
  ]);
  const withdrawnCents = pickSummaryCentsAsMajor(inner, [
    "totalWithdrawnCents",
    "total_withdrawn_cents",
    "totalWithdrawalCents",
    "total_withdrawal_cents",
  ]);

  return {
    totalAmountDeposited:
      depositedCents ??
      depositedNested ??
      pickSummaryAmount(inner, [
        "totalAmountDeposited",
        "total_amount_deposited",
        "totalDeposited",
        "total_deposited",
        "totalDepositAmount",
        "depositsTotal",
        "depositAmount",
        "totalDeposits",
      ]),
    totalAmountWithdrawn:
      withdrawnCents ??
      withdrawnNested ??
      pickSummaryAmount(inner, [
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

function transactionListQueryToParams(query: AdminTransactionListQuery) {
  const limit = query.pageSize;
  return {
    page: query.page,
    limit,
    search: query.search,
    status: query.status,
    tab: query.tab,
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  };
}

/** Map transactions UI tab label to OpenAPI `tab` query value. */
export function tabToApiTab(tab: string): string | undefined {
  switch (tab) {
    case "All":
      return undefined;
    case "Deposit":
      return "deposit";
    case "Withdrawal":
      return "withdrawal";
    case "E-sim":
      return "esim";
    case "E-trade":
      return "e-trade";
    case "Giftcard":
      return "gift-card";
    case "Crypto":
      return "crypto";
    case "Utility":
      return "utility";
    default:
      return tab.trim().toLowerCase().replace(/\s+/g, "-");
  }
}

/** @deprecated Use tabToApiTab — list filter is OpenAPI `tab`, not categorySlug. */
export function tabToCategorySlug(tab: string): string | undefined {
  return tabToApiTab(tab);
}

/** @deprecated Use tabToApiTab */
export function tabChannelToApiChannel(tab: string): string {
  return tabToApiTab(tab) ?? tab;
}

function unwrapTransactionRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = pickNestedRecord(raw, ["transaction", "tx", "payment", "order", "details"]);
  if (!inner) return raw;
  // Top-level fields (user, provider, reference) win over nested shells.
  return { ...inner, ...raw };
}

/** Merge common nested wallet/product blocks so list rows pick up status, dates, and biller fields. */
export function flattenTransactionRecord(raw: Record<string, unknown>): Record<string, unknown> {
  const o = unwrapTransactionRecord(raw);
  const merged: Record<string, unknown> = {};
  for (const key of [
    "walletTransaction",
    "wallet_transaction",
    "ledger",
    "ledgerEntry",
    "timestamps",
    "timeStamps",
    "dates",
    "timing",
    "metadata",
    "meta",
    "product",
    "payment",
    "details",
    "transactionDetails",
    "transaction_details",
    "additionalInfo",
    "additional_info",
    "submission",
    "giftCardSubmission",
    "gift_card_submission",
  ]) {
    const nested = asRecord(o[key]);
    if (nested) Object.assign(merged, nested);
  }
  return { ...merged, ...o };
}

export function normalizeTransactionRow(raw: unknown, index = 0): AdminTransactionListRow | null {
  const base = asRecord(raw);
  if (!base) return null;
  const o = flattenTransactionRecord(base);

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

  const amountKobo =
    pickKobo(o, ["amount", "value", "totalAmount", "transactionAmount", "amountPaid", "paidAmount"]) ??
    (amountBlock ? pickKobo(amountBlock, ["value", "amount", "total", "paid"]) : undefined) ??
    pickKobo(o, ["amountCents", "amount_cents", "amountInCents", "amount_in_cents", "amountKobo", "amount_kobo"]);
  const currency =
    pickString(o, ["currency", "asset", "currencyCode"]) ||
    (amountBlock ? pickString(amountBlock, ["currency", "code"]) : "") ||
    "";
  const amount =
    amountKobo !== undefined
      ? formatKoboAmountDisplay(amountKobo, currency)
      : pickString(o, ["amountFormatted", "amount_display", "formattedAmount"]) ||
        (amountBlock ? pickString(amountBlock, ["formatted", "display"]) : "") ||
        "—";

  const channel = pickTransactionChannel(o);
  const product = pickTransactionProduct(o, channel);

  let provider = pickProviderLabel(o);
  if (provider === "—") {
    const narr = pickString(o, [
      "narration",
      "description",
      "remark",
      "memo",
      "beneficiaryName",
      "beneficiary_name",
      "recipientName",
      "recipient_name",
      "counterparty",
      "institutionName",
      "institution_name",
      "packageName",
      "package_name",
      "bouquet",
      "planName",
      "plan_name",
      "networkProvider",
      "network_provider",
    ]);
    if (narr) provider = humanizeLabel(narr);
    else if (product && product !== "—") provider = product;
  }

  const statusRaw = readStatusRaw(o);
  const status = statusRaw ? humanizeStatus(statusRaw) : "—";
  const dateRaw = readDateRaw(o) || parseDateFromReference(referenceNo);
  const customerName =
    pickString(o, ["customerName", "customer_name", "accountHolderName", "account_holder_name", "ownerName", "owner_name", "accountName", "account_name", "userFullName", "user_full_name", "displayName", "display_name"]) ||
    pickNestedString(o, [
      ["customer", "name"],
      ["customer", "fullName"],
      ["user", "name"],
      ["user", "fullName"],
      ["account", "name"],
      ["account", "accountName"],
      ["beneficiary", "name"],
      ["payer", "name"],
    ]) ||
    (customerBlock ? formatPersonName(customerBlock) : "") ||
    formatPersonName(o) ||
    "—";

  return {
    id: referenceNo,
    refNo: referenceNo,
    customerName,
    channel,
    product,
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
  const qs = buildQuery(transactionListQueryToParams({ ...query, page, pageSize }));
  const body = await adminRequest<unknown>(`/admin/transactions${qs}`, { method: "GET" });
  const result = normalizeTransactionListResponse(body, page, pageSize);
  if (!giftcardMocksEnabled()) return result;
  return mergeGiftcardMockTransactions(result, query);
}

export async function getAdminTransactionDetail(reference: string): Promise<Record<string, unknown>> {
  const ref = reference.trim();
  if (giftcardMocksEnabled() && isGiftcardMockReference(ref)) {
    return getGiftcardMockDetail(ref);
  }
  const data = await adminRequest<unknown>(`/admin/transactions/${encodeURIComponent(ref)}`, {
    method: "GET",
  });
  const r = asRecord(data);
  if (!r) return {};
  const inner = asRecord(r.data);
  return inner ?? r;
}

export async function getAdminTransactionLogs(reference: string): Promise<TransactionLogEntry[]> {
  const ref = reference.trim();
  if (giftcardMocksEnabled() && isGiftcardMockReference(ref)) {
    return getGiftcardMockLogs(ref);
  }
  const data = await adminRequest<unknown>(
    `/admin/transactions/${encodeURIComponent(ref)}/logs`,
    { method: "GET" },
  );
  return normalizeTransactionLogList(data);
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

export {
  asRecord,
  formatDisplayDate,
  formatPersonName,
  pickNestedRecord,
  pickNestedString,
  pickNum,
  pickProviderLabel,
  pickString,
  unwrapTransactionRecord,
};

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
