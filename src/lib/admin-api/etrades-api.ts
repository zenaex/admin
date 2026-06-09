import { adminRequest } from "@/lib/admin-api/client";
import {
  formatKoboAsNgn,
  formatNgnMajor,
  koboSummaryToMajor,
  koboToMajor,
  majorToKobo,
  parseMajorAmountInput,
  parseMajorAmountInputAsKobo,
  pickKobo,
} from "@/lib/admin-api/money";
import type { EtradeRequestRow, EtradeRequestStatus } from "@/components/e-trades/etrade-types";
import type {
  EtradeDetailOutcome,
  EtradeTransactionDetail,
  EtradeTransactionListRow,
  EtradeTxnListStatus,
} from "@/components/e-trades/etrade-mock-transactions";

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
    "etrades",
    "eTrades",
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
  const fromTop = firstArrayFromRecord(r);
  if (fromTop) return fromTop;

  const inner =
    r.data ?? r.items ?? r.results ?? r.etrades ?? r.eTrades ?? r.rows ?? r.records ?? r.list;
  if (Array.isArray(inner)) return inner;

  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested = firstArrayFromRecord(dataInner);
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
  const total =
    pickNum(r, ["total", "totalCount", "totalItems", "count"]) ??
    (meta ? pickNum(meta, ["total", "totalCount", "totalItems"]) : undefined) ??
    (dataInner ? pickNum(dataInner, ["total", "totalCount", "totalItems"]) : undefined) ??
    (pagination ? pickNum(pagination, ["total", "totalCount", "totalItems"]) : undefined);
  return total ?? fallback;
}

function extractPageMeta(
  data: unknown,
  requestedPage: number,
  requestedPageSize: number,
): { page: number; pageSize: number } {
  const r = asRecord(data);
  const meta = r ? asRecord(r.meta) : null;
  const dataInner = r ? asRecord(r.data) : null;
  const pagination =
    (r ? asRecord(r.pagination) : null) ??
    (dataInner ? asRecord(dataInner.pagination) : null);
  const page =
    pickNum(r ?? {}, ["page", "currentPage"]) ??
    (meta ? pickNum(meta, ["page", "currentPage"]) : undefined) ??
    (pagination ? pickNum(pagination, ["page", "currentPage"]) : undefined) ??
    requestedPage;
  const pageSize =
    pickNum(r ?? {}, ["pageSize", "limit", "perPage"]) ??
    (meta ? pickNum(meta, ["pageSize", "limit", "perPage"]) : undefined) ??
    (pagination ? pickNum(pagination, ["pageSize", "limit", "perPage"]) : undefined) ??
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
    const timePart = d
      .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      .replace(/\s/g, "");
    return `${datePart} | ${timePart}`;
  }
  return isoOrAny;
}

function formatSubtitle(isoOrAny: string): string {
  if (!isoOrAny) return "Etrade";
  const d = new Date(isoOrAny);
  if (!Number.isNaN(d.getTime())) {
    const timePart = d
      .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      .replace(/\s/g, "");
    return `Etrade • ${timePart}`;
  }
  return `Etrade • ${isoOrAny}`;
}

function humanizeTradeType(raw: string): string {
  if (!raw) return "—";
  const t = raw.replace(/_/g, " ").trim();
  return t
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** API status enum: `awaiting_approval` | `completed` | `rejected` */
export type AdminEtradeApiStatus = "awaiting_approval" | "completed" | "rejected";

/** API trade type enum: `exchange_rate` | `percentage` */
export type AdminEtradeApiTradeType = "exchange_rate" | "percentage";

export function mapApiEtradeStatusToUi(raw: string): EtradeRequestStatus {
  const s = raw.toLowerCase().replace(/_/g, " ");
  if (s === "awaiting approval" || s.includes("await")) return "Pending";
  if (s === "rejected" || s.includes("reject") || s.includes("declin") || s.includes("fail"))
    return "Failed";
  if (s === "completed" || s.includes("complete") || s.includes("success")) return "Successful";
  if (s.includes("pending") || s.includes("review")) return "Pending";
  return "Successful";
}

export function mapApiEtradeStatusToCompleted(raw: string): EtradeTxnListStatus {
  const s = raw.toLowerCase().replace(/_/g, " ");
  if (s === "rejected" || s.includes("reject") || s.includes("declin") || s.includes("fail"))
    return "Failed";
  return "Successful";
}

export function mapApiEtradeStatusToOutcome(raw: string): EtradeDetailOutcome {
  const ui = mapApiEtradeStatusToUi(raw);
  if (ui === "Pending") return "pending";
  if (ui === "Failed") return "failed";
  return "approved";
}

export function isActiveEtradeStatus(raw: string): boolean {
  const s = raw.toLowerCase().replace(/_/g, " ");
  return s === "awaiting approval" || s.includes("await") || mapApiEtradeStatusToUi(raw) === "Pending";
}

export function uiStatusToApiStatus(
  ui: string,
  tab?: "requests" | "transaction-details",
): AdminEtradeApiStatus | undefined {
  const s = ui.trim().toLowerCase();
  if (!s || s === "all statuses") {
    if (tab === "requests") return "awaiting_approval";
    return undefined;
  }
  if (s === "pending" || s === "awaiting approval") return "awaiting_approval";
  if (s === "successful" || s === "completed") return "completed";
  if (s === "failed" || s === "rejected") return "rejected";
  return undefined;
}

export function uiTradeTypeToApi(ui: string): AdminEtradeApiTradeType | undefined {
  const s = ui.trim().toLowerCase();
  if (!s || s === "all types") return undefined;
  if (s.includes("exchange")) return "exchange_rate";
  if (s.includes("percent")) return "percentage";
  if (s === "exchange_rate" || s === "percentage") return s;
  return undefined;
}

export type AdminEtradeListQuery = {
  page?: number;
  /** Sent as `limit` query param. */
  limit?: number;
  pageSize?: number;
  search?: string;
  status?: AdminEtradeApiStatus;
  tradeType?: AdminEtradeApiTradeType;
  fromDate?: string;
  toDate?: string;
  tab?: "requests" | "transaction-details";
};

export type AdminEtradeNormalized = {
  id: string;
  tradeId: string;
  title: string;
  subtitle: string;
  rawStatus: string;
  uiStatus: EtradeRequestStatus;
  completedStatus: EtradeTxnListStatus;
  etradeType: string;
  customer: string;
  customerAccountId?: string;
  dateCreated: string;
  tradeValue: string;
  amount: string;
  opsInCharge: string;
};

export type AdminEtradeListResult = {
  items: AdminEtradeNormalized[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminEtradeSummaryCards = {
  totalTrades: string;
  totalTradeVolume: string;
  awaitingApproval: string;
};

/** `POST /admin/etrades` request body (OpenAPI). */
export type CreateAdminEtradeBody = {
  customerId: string;
  tradeType: AdminEtradeApiTradeType;
  requestType: string;
  tradeAmount: number;
  tradeCurrency: string;
  vendorRate: number;
  ourMarkupRate: number;
  vendorPercentage: number;
  customerPercentage: number;
  proofImageUrl?: string;
};

function formatTradeAmountDisplay(
  o: Record<string, unknown>,
  currency?: string,
): string {
  const cur = (currency || pickString(o, ["tradeCurrency", "currency", "amountCurrency"]) || "USD").toUpperCase();
  const pre = pickString(o, [
    "tradeAmountDisplay",
    "tradeAmountFormatted",
    "tradeValue",
    "trade_value",
    "amountDisplay",
  ]);
  if (pre) return pre;

  if (cur === "NGN" || cur === "NAIRA") {
    const kobo = pickKobo(o, ["tradeAmount", "trade_amount", "amount", "ngnEquivalent", "ngn_equivalent"]);
    if (kobo !== undefined) return formatKoboAsNgn(kobo);
  }

  const num = pickNum(o, ["tradeAmount", "trade_amount", "amount"]);
  if (num !== undefined) {
    if (cur === "USD")
      return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${cur} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return "—";
}

function formatRateFee(o: Record<string, unknown>): string {
  const pre = pickString(o, ["rateFee", "rate_fee", "rate", "customerRate", "customer_rate", "rateDisplay"]);
  if (pre) return pre;

  const tradeType = pickString(o, ["tradeType", "trade_type"]).toLowerCase();
  if (tradeType === "percentage") {
    const vendorPct = pickNum(o, ["vendorPercentage", "vendor_percentage"]);
    const customerPct = pickNum(o, ["customerPercentage", "customer_percentage"]);
    if (vendorPct !== undefined && customerPct !== undefined) {
      return `${customerPct}% / ${vendorPct}%`;
    }
  }

  const vendorKobo = pickKobo(o, ["vendorRate", "vendor_rate"]);
  const markupKobo = pickKobo(o, ["ourMarkupRate", "our_markup_rate"]);
  const vendor = vendorKobo !== undefined ? koboToMajor(vendorKobo) : pickNum(o, ["vendorRate", "vendor_rate"]);
  const markup = markupKobo !== undefined ? koboToMajor(markupKobo) : pickNum(o, ["ourMarkupRate", "our_markup_rate"]);
  const customer =
    pickNum(o, ["customerRate", "customer_rate"]) ??
    (vendor !== undefined && markup !== undefined ? Math.max(0, vendor - markup) : vendor);
  if (customer !== undefined) return `₦${customer.toLocaleString()}/$1`;
  return "—";
}

function normalizeEtradeRow(raw: unknown, idx: number): AdminEtradeNormalized | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id =
    pickString(o, ["id", "etradeId", "etrade_id", "tradeId", "trade_id", "uuid"]) ||
    `etrade-${idx}`;
  const tradeId =
    pickString(o, ["tradeId", "trade_id", "reference", "referenceId", "sessionId", "session_id"]) ||
    id;
  const title =
    pickString(o, ["requestType", "request_type", "title", "requestDetails", "request_details", "tradeName"]) ||
    "—";
  const rawStatus =
    pickString(o, ["status", "tradeStatus", "trade_status", "state"]) || "awaiting_approval";
  const uiStatus = mapApiEtradeStatusToUi(rawStatus);
  const completedStatus = mapApiEtradeStatusToCompleted(rawStatus);

  const first = pickString(o, ["customerFirstName", "customer_first_name"]);
  const last = pickString(o, ["customerLastName", "customer_last_name"]);
  const customer =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(o, ["customerName", "customer_name", "customer", "userName", "user_name"]) ||
    "—";
  const customerAccountId = pickString(o, ["customerId", "customer_id", "accountId", "account_id", "userId"]);

  const dateRaw =
    pickString(o, ["createdAt", "created_at", "dateCreated", "date_created", "initiatedAt"]) ||
    "";
  const dateCreated = dateRaw ? formatDisplayDate(dateRaw) : "—";
  const subtitle = dateRaw ? formatSubtitle(dateRaw) : "Etrade";

  const etradeType = humanizeTradeType(
    pickString(o, ["etradeType", "etrade_type", "tradeType", "trade_type", "type"]) || "—",
  );

  const tradeCurrency = pickString(o, ["tradeCurrency", "trade_currency", "currency"]);
  const tradeValue = formatTradeAmountDisplay(o, tradeCurrency || undefined);
  const opsInCharge =
    pickString(o, ["opsInCharge", "ops_in_charge", "assignedTo", "assigned_to", "operatorName"]) ||
    "—";

  return {
    id,
    tradeId,
    title,
    subtitle,
    rawStatus,
    uiStatus,
    completedStatus,
    etradeType,
    customer,
    customerAccountId: customerAccountId || undefined,
    dateCreated,
    tradeValue,
    amount: tradeValue,
    opsInCharge,
  };
}

export function toEtradeRequestRow(row: AdminEtradeNormalized): EtradeRequestRow {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    status: row.uiStatus,
    etradeType: row.etradeType,
    tradeId: row.tradeId,
    customer: row.customer,
    dateCreated: row.dateCreated,
    tradeValue: row.tradeValue,
    opsInCharge: row.opsInCharge,
  };
}

export function toEtradeTransactionListRow(row: AdminEtradeNormalized): EtradeTransactionListRow {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    amount: row.amount,
    status: row.completedStatus,
    tradeId: row.tradeId,
    customer: row.customer,
    dateCreated: row.dateCreated,
    tradeValue: row.tradeValue,
    opsInCharge: row.opsInCharge,
  };
}

function tabToStatusParam(tab?: AdminEtradeListQuery["tab"]): AdminEtradeApiStatus | undefined {
  if (tab === "requests") return "awaiting_approval";
  return undefined;
}

export async function getAdminEtradesList(
  query: AdminEtradeListQuery = {},
): Promise<AdminEtradeListResult> {
  const page = query.page ?? 1;
  const limit = query.limit ?? query.pageSize ?? 18;
  const status = query.status ?? tabToStatusParam(query.tab);
  const qs = buildQuery({
    page,
    limit,
    search: query.search,
    status,
    tradeType: query.tradeType,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });

  const data = await adminRequest<unknown>(`/admin/etrades${qs}`, { auth: true });
  const rawItems = extractItemsArray(data);
  let items = rawItems
    .map((row, idx) => normalizeEtradeRow(row, idx))
    .filter((r): r is AdminEtradeNormalized => r !== null);

  if (query.tab === "transaction-details" && !status) {
    items = items.filter((r) => !isActiveEtradeStatus(r.rawStatus));
  }

  const { page: resolvedPage, pageSize: resolvedPageSize } = extractPageMeta(data, page, limit);
  const total = extractTotal(data, items.length);

  return {
    items,
    total,
    page: resolvedPage,
    pageSize: resolvedPageSize,
  };
}

function formatSummaryCount(value: number | string | undefined): string {
  if (value === undefined) return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString();
  }
  const n = Number(String(value).replace(/[^\d.-]/g, ""));
  if (Number.isFinite(n) && String(value).replace(/[^\d.-]/g, "") !== "") {
    return n.toLocaleString();
  }
  return String(value);
}

function formatSummaryVolume(value: number | string | undefined): string {
  const major = koboSummaryToMajor(value);
  if (typeof major === "number" && Number.isFinite(major)) {
    return formatNgnMajor(major);
  }
  if (typeof major === "string" && major) return major;
  return "—";
}

export async function getAdminEtradesSummary(): Promise<AdminEtradeSummaryCards> {
  const data = await adminRequest<unknown>("/admin/etrades/summary", { auth: true });
  const r = asRecord(data) ?? {};
  const inner = asRecord(r.data) ?? r;

  const totalTrades =
    pickNum(inner, ["totalTrades", "total_trades", "totalTrade", "total_trade", "count"]) ??
    pickNum(r, ["totalTrades", "total_trades", "totalTrade", "total_trade", "count"]);

  const totalVolumeKobo =
    pickKobo(inner, [
      "totalTradeVolume",
      "total_trade_volume",
      "totalVolume",
      "total_volume",
      "volume",
      "totalAmount",
      "total_amount",
    ]) ??
    pickKobo(r, [
      "totalTradeVolume",
      "total_trade_volume",
      "totalVolume",
      "total_volume",
      "volume",
      "totalAmount",
      "total_amount",
    ]);

  const awaiting =
    pickNum(inner, [
      "awaitingApproval",
      "awaiting_approval",
      "pendingCount",
      "pending_count",
      "pending",
    ]) ??
    pickNum(r, [
      "awaitingApproval",
      "awaiting_approval",
      "pendingCount",
      "pending_count",
      "pending",
    ]);

  return {
    totalTrades: formatSummaryCount(totalTrades),
    totalTradeVolume:
      totalVolumeKobo !== undefined ? formatKoboAsNgn(totalVolumeKobo) : formatSummaryVolume(pickString(inner, ["totalTradeVolume", "total_trade_volume"])),
    awaitingApproval: formatSummaryCount(awaiting),
  };
}

/** `GET /admin/etrades/export` — no query parameters per OpenAPI. */
export async function getAdminEtradesExport(): Promise<unknown> {
  return adminRequest<unknown>("/admin/etrades/export", { auth: true });
}

function normalizeEtradeDetail(raw: unknown, id: string): EtradeTransactionDetail {
  const o = asRecord(raw) ?? {};
  const inner = asRecord(o.data) ?? o;

  const rawStatus = pickString(inner, ["status", "tradeStatus", "state"]) || "awaiting_approval";
  const outcome = mapApiEtradeStatusToOutcome(rawStatus);

  const first = pickString(inner, ["customerFirstName", "customer_first_name"]);
  const last = pickString(inner, ["customerLastName", "customer_last_name"]);
  const customerName =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(inner, ["customerName", "customer_name", "customer"]) ||
    "—";

  const countryName = pickString(inner, ["country", "countryName", "country_name"]);
  const countryCurrency = pickString(inner, ["currency", "tradeCurrency", "trade_currency"]);
  const country =
    countryName && countryCurrency
      ? `${countryName} | ${countryCurrency}`
      : countryName || countryCurrency || "—";

  const tradeCurrency = countryCurrency || pickString(inner, ["tradeCurrency", "currency"]) || "USD";
  const tradeAmount = formatTradeAmountDisplay(inner, tradeCurrency);
  const rateFee = formatRateFee(inner);

  const ngnKobo =
    pickKobo(inner, ["ngnEquivalent", "ngn_equivalent", "amountEquivalent", "amount_equivalent", "ngnAmount"]) ??
    pickKobo(o, ["ngnEquivalent", "ngn_equivalent"]);
  const ngnEquivalent = ngnKobo !== undefined ? formatKoboAsNgn(ngnKobo) : pickString(inner, ["ngnEquivalent", "ngn_equivalent"]) || "—";

  const createdRaw = pickString(inner, ["createdAt", "created_at", "dateInitiated", "date_initiated"]);
  const completedRaw =
    pickString(inner, ["completedAt", "completed_at", "dateCompleted", "date_completed", "approvedAt", "approved_at"]) ||
    createdRaw;

  const approvedBy = pickString(inner, ["approvedBy", "approved_by", "approverName"]) || "—";
  const dateApprovedRaw = pickString(inner, ["approvedAt", "approved_at", "dateApproved", "date_approved"]);

  return {
    id: pickString(inner, ["id", "etradeId"]) || id,
    outcome,
    sessionId:
      pickString(inner, ["sessionId", "session_id", "tradeId", "trade_id", "reference"]) || id,
    customerName,
    channel: pickString(inner, ["channel"]) || "Etrade",
    requestDetails:
      pickString(inner, ["requestType", "request_type", "requestDetails", "request_details", "title"]) ||
      "—",
    country,
    tradeAmount,
    rateFee,
    ngnEquivalent,
    dateInitiated: createdRaw ? formatDisplayDate(createdRaw) : "—",
    dateCompleted:
      outcome === "pending" ? "—" : completedRaw ? formatDisplayDate(completedRaw) : "—",
    opsInCharge: pickString(inner, ["opsInCharge", "ops_in_charge", "assignedTo"]) || "—",
    approvedBy: outcome === "approved" ? approvedBy : "—",
    dateApproved:
      outcome === "approved" && dateApprovedRaw ? formatDisplayDate(dateApprovedRaw) : "—",
    device: pickString(inner, ["device", "deviceName", "device_name"]) || "—",
    deviceId: pickString(inner, ["deviceId", "device_id"]) || "—",
    location: pickString(inner, ["location", "locationName"]) || "—",
    locationCoordinate:
      pickString(inner, ["locationCoordinate", "location_coordinate", "coordinates", "latLng"]) ||
      "—",
  };
}

export async function getAdminEtradeDetail(id: string): Promise<EtradeTransactionDetail> {
  const data = await adminRequest<unknown>(`/admin/etrades/${encodeURIComponent(id)}`, {
    auth: true,
  });
  return normalizeEtradeDetail(data, id);
}

export async function approveAdminEtrade(id: string): Promise<unknown> {
  return adminRequest<unknown>(`/admin/etrades/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    auth: true,
  });
}

export async function rejectAdminEtrade(id: string, reason: string): Promise<unknown> {
  return adminRequest<unknown>(`/admin/etrades/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ reason: reason.trim() }),
  });
}

/** Parse USD amount from form input like `$100,000.00` (major dollars). */
export function parseUsdTradeAmountInput(input: string): number {
  const normalized = input.replace(/,/g, "").replace(/[^\d.]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

/** NGN rate fields (`vendorRate`, `ourMarkupRate`) are posted in kobo. */
export function parseNgnRateInputAsKobo(input: string): number {
  return majorToKobo(parseNgnRateInput(input));
}

/** Parse NGN rate from strings like `$1/₦1200` or `1200`. */
export function parseNgnRateInput(input: string): number {
  const ngnMatch = input.match(/₦\s*([\d,.]+)/);
  if (ngnMatch?.[1]) return parseMajorAmountInput(ngnMatch[1]);
  const slashMatch = input.match(/\/\s*₦?\s*([\d,.]+)/);
  if (slashMatch?.[1]) return parseMajorAmountInput(slashMatch[1]);
  return parseMajorAmountInput(input);
}

export function buildCreateEtradeBody(form: {
  customerId: string;
  requestType: string;
  tradeTypeLabel: string;
  tradeAmount: string;
  vendorRate: string;
  markupRate: string;
  customerRate?: string;
  proofImageUrl?: string;
}): CreateAdminEtradeBody {
  const tradeType: AdminEtradeApiTradeType = form.tradeTypeLabel.toLowerCase().includes("percent")
    ? "percentage"
    : "exchange_rate";

  const tradeAmount = parseUsdTradeAmountInput(form.tradeAmount);

  if (tradeType === "percentage") {
    const vendorPercentage = parseMajorAmountInput(form.vendorRate);
    const customerPercentage = form.customerRate
      ? parseMajorAmountInput(form.customerRate.replace(/[^\d.]/g, ""))
      : Math.max(0, vendorPercentage - parseMajorAmountInput(form.markupRate));

    return {
      customerId: form.customerId,
      tradeType,
      requestType: form.requestType.trim(),
      tradeAmount,
      tradeCurrency: "USD",
      vendorRate: 0,
      ourMarkupRate: 0,
      vendorPercentage,
      customerPercentage,
      proofImageUrl: form.proofImageUrl?.trim() || "",
    };
  }

  return {
    customerId: form.customerId,
    tradeType,
    requestType: form.requestType.trim(),
    tradeAmount,
    tradeCurrency: "USD",
    vendorRate: parseNgnRateInputAsKobo(form.vendorRate),
    ourMarkupRate: parseMajorAmountInputAsKobo(form.markupRate),
    vendorPercentage: 0,
    customerPercentage: 0,
    proofImageUrl: form.proofImageUrl?.trim() || "",
  };
}

function serializeCreateEtradeBody(body: CreateAdminEtradeBody): CreateAdminEtradeBody {
  return {
    customerId: body.customerId,
    tradeType: body.tradeType,
    requestType: body.requestType,
    tradeAmount: body.tradeAmount,
    tradeCurrency: body.tradeCurrency,
    vendorRate: body.vendorRate,
    ourMarkupRate: body.ourMarkupRate,
    vendorPercentage: body.vendorPercentage,
    customerPercentage: body.customerPercentage,
    proofImageUrl: body.proofImageUrl?.trim() || "",
  };
}

export async function createAdminEtrade(body: CreateAdminEtradeBody): Promise<AdminEtradeNormalized> {
  const data = await adminRequest<unknown>("/admin/etrades", {
    method: "POST",
    auth: true,
    body: JSON.stringify(serializeCreateEtradeBody(body)),
  });
  const row = normalizeEtradeRow(asRecord(data)?.data ?? data, 0);
  if (!row) {
    throw new Error("Invalid e-trade create response");
  }
  return row;
}
