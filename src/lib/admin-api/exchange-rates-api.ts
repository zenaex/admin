import { adminRequest } from "@/lib/admin-api/client";
import type { ExchangeRateRow, ExchangeRateSubTab, GiftcardBrand, SwapPairMeta } from "@/components/product-mgt/product-mgt-types";

// Helper utilities for normalization
function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

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
  for (const key of ["items", "rates", "results", "rows", "records", "list", "content", "data", "brands"]) {
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

  const inner = r.data ?? r.items ?? r.results ?? r.rates ?? r.rows ?? r.records ?? r.list;
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
  const pagination = asRecord(r.pagination) ?? (dataInner ? asRecord(dataInner.pagination) : null);
  const n =
    pickNum(r, ["total", "totalCount", "count", "totalItems", "totalElements"]) ??
    (dataInner ? pickNum(dataInner, ["total", "totalCount", "count", "totalItems", "totalElements"]) : undefined) ??
    (pagination ? pickNum(pagination, ["total", "totalCount", "count", "totalElements"]) : undefined) ??
    (meta ? pickNum(meta, ["total", "totalCount", "count", "totalElements"]) : undefined);
  if (n !== undefined && n >= 0) return n;
  return fallback;
}

function formatDisplayDate(isoOrAny: string): string {
  if (!isoOrAny) return "—";
  const d = new Date(isoOrAny);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return isoOrAny;
}

function humanizeCommissionType(apiType: string): string {
  const t = apiType.trim().toLowerCase();
  if (t === "percentage_with_cap" || t === "percentage-with-cap" || t === "% capped @") return "% capped @";
  if (t === "percentage") return "Percentage";
  if (t === "flat") return "Flat";
  return "—";
}

function formatCommissionValue(type: string, rate: number | string): string {
  const cleaned = String(rate).replace(/[^\d.]/g, "");
  if (!cleaned || cleaned === "0") return "—";
  const t = type.trim().toLowerCase();
  if (t === "percentage" || t === "percentage_with_cap" || t === "percentage-with-cap") {
    return `${cleaned}%`;
  }
  if (t === "flat") {
    return `₦${parseFloat(cleaned).toLocaleString()} FLAT`;
  }
  return cleaned;
}

function normalizeExchangeRateRow(raw: unknown, index: number, subTab: ExchangeRateSubTab): ExchangeRateRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = pickString(o, ["id", "rateId", "rate_id", "uuid"]) || `rate-${subTab}-${index}`;
  const currencyCode = pickString(o, ["currencyCode", "currency_code", "code", "symbol", "base"]) || "—";
  const currencyName = pickString(o, ["currencyName", "currency_name", "name", "title"]) || currencyCode;
  const countryCode = pickString(o, ["countryCode", "country_code", "country"]) || null;

  const commissionType = humanizeCommissionType(pickString(o, ["commissionType", "commission_type", "markupType", "markup_type"]));
  const commissionRateVal = pickString(o, ["ourCommission", "our_commission", "commissionRate", "markupRate", "rate", "commission"]);
  const ourCommission = commissionRateVal ? formatCommissionValue(commissionType, commissionRateVal) : "—";

  const baseRateVal = pickString(o, ["baseRate", "base_rate", "base"]);
  const baseRate = baseRateVal ? (baseRateVal.includes("/") ? baseRateVal : `1/${baseRateVal}`) : "—";

  const finalRateVal = pickString(o, ["finalRate", "final_rate", "rate", "final"]);
  const finalRate = finalRateVal ? (finalRateVal.includes("/") ? finalRateVal : `1/${finalRateVal}`) : "—";

  const updatedAtRaw = pickString(o, ["dateUpdated", "date_updated", "updatedAt", "updated_at", "modifiedAt"]);
  const dateUpdated = updatedAtRaw ? formatDisplayDate(updatedAtRaw) : "—";

  let swapPair: SwapPairMeta | undefined;
  if (subTab === "swap-crypto") {
    const baseCode = pickString(o, ["baseCode", "base_code", "baseCurrency", "base"]);
    const baseName = pickString(o, ["baseName", "base_name", "baseCurrencyName", "base_name_full"]) || baseCode;
    const quoteCode = pickString(o, ["quoteCode", "quote_code", "quoteCurrency", "quote"]);
    const quoteName = pickString(o, ["quoteName", "quote_name", "quoteCurrencyName", "quote_name_full"]) || quoteCode;
    if (baseCode && quoteCode) {
      swapPair = { baseCode, baseName, quoteCode, quoteName };
    }
  }

  return {
    id,
    currencyCode,
    currencyName,
    countryCode,
    commissionType,
    ourCommission,
    baseRate,
    finalRate,
    dateUpdated,
    swapPair,
  };
}

function normalizeGiftcardBrand(raw: unknown, index: number): GiftcardBrand | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = pickString(o, ["id", "configId", "config_id", "uuid"]) || `gc-brand-${index}`;
  const brandName = pickString(o, ["brandName", "brand_name", "name", "title"]) || "—";
  const brandType = (pickString(o, ["brandType", "brand_type", "type"]) || "E-code") as "E-code" | "Physical";
  const country = pickString(o, ["country", "brandCountry"]) || "USA";
  const countryCode = pickString(o, ["countryCode", "country_code"]) || "US";

  const commissionType = humanizeCommissionType(pickString(o, ["commissionType", "commission_type", "markupType", "markup_type"]));
  const commissionRateVal = pickString(o, ["ourCommission", "our_commission", "markupRate", "commissionRate"]);
  const ourCommission = commissionRateVal ? formatCommissionValue(commissionType, commissionRateVal) : "—";

  const rmbRate = pickString(o, ["rmbRate", "rmb_rate", "rmb"]) || "—";
  const iconUrl = pickString(o, ["iconUrl", "icon_url", "icon"]) || undefined;

  const denomsRaw = o.denominations ?? o.categories ?? [];
  const denominations = (Array.isArray(denomsRaw) ? denomsRaw : []).map((d: unknown, dIdx: number) => {
    const doRecord = asRecord(d) || {};
    const dId = pickString(doRecord, ["id", "denomId", "uuid"]) || `denom-${dIdx}`;
    const label = pickString(doRecord, ["label", "name", "title"]) || "—";
    const vendorRateVal = pickString(doRecord, ["vendorRate", "vendor_rate", "rate"]);
    const vendorRate = vendorRateVal ? (vendorRateVal.startsWith("$") || vendorRateVal.startsWith("¥") ? vendorRateVal : `$${vendorRateVal}`) : "—";
    const finalRateVal = pickString(doRecord, ["finalRate", "final_rate", "rate", "final"]);
    const finalRate = finalRateVal ? (finalRateVal.includes("/") ? finalRateVal : `$1/₦${finalRateVal}`) : "—";
    const dUpdatedAtRaw = pickString(doRecord, ["dateUpdated", "date_updated", "updatedAt", "updated_at"]);
    const dateUpdated = dUpdatedAtRaw ? formatDisplayDate(dUpdatedAtRaw) : "—";
    const status = (pickString(doRecord, ["status", "denomStatus"]) || "Active") as "Active" | "Inactive";

    return { id: dId, label, vendorRate, finalRate, dateUpdated, status };
  });

  return {
    id,
    brandName,
    brandType,
    country,
    countryCode,
    commissionType,
    ourCommission,
    rmbRate,
    iconUrl,
    denominations,
  };
}

export type ExchangeRateListResult = {
  items: ExchangeRateRow[];
  total: number;
};

/** `GET /admin/rates/{subTab}` — List rates for fiat, sell-crypto, swap-crypto, etc. */
export async function getExchangeRates(subTab: ExchangeRateSubTab): Promise<ExchangeRateListResult> {
  const pathMap: Record<ExchangeRateSubTab, string> = {
    fiat: "/admin/rates/fiat",
    "sell-crypto": "/admin/rates/sell-crypto",
    "swap-crypto": "/admin/rates/swap-crypto",
    giftcard: "/admin/rates/gift-card",
  };
  const path = pathMap[subTab] ?? "/admin/rates/fiat";
  const body = await adminRequest<unknown>(path, { method: "GET" });
  const itemsRaw = extractItemsArray(body);
  const items = itemsRaw.map((raw, idx) => normalizeExchangeRateRow(raw, idx, subTab)).filter((x): x is ExchangeRateRow => x !== null);
  const total = extractTotal(body, items.length);
  return { items, total };
}

/** `GET /admin/rates/gift-card` — List gift card brand rates */
export async function getGiftcardRates(): Promise<GiftcardBrand[]> {
  const body = await adminRequest<unknown>("/admin/rates/gift-card", { method: "GET" });
  const itemsRaw = extractItemsArray(body);
  return itemsRaw.map((raw, idx) => normalizeGiftcardBrand(raw, idx)).filter((x): x is GiftcardBrand => x !== null);
}

/** `POST /admin/rates/fiat/{base}/{quote}/configure` — Configure fiat markup for a currency pair */
export async function postConfigureFiatRate(
  base: string,
  quote: string,
  body: { markupType: string; markupRate: number; baseRate?: number }
): Promise<void> {
  await adminRequest(`/admin/rates/fiat/${encodeURIComponent(base)}/${encodeURIComponent(quote)}/configure`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** `POST /admin/rates/sell-crypto/{cryptoSlug}/configure` — Configure markup for selling a crypto asset */
export async function postConfigureSellCryptoRate(
  cryptoSlug: string,
  body: { markupType: string; markupRate: number }
): Promise<void> {
  await adminRequest(`/admin/rates/sell-crypto/${encodeURIComponent(cryptoSlug)}/configure`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** `POST /admin/rates/swap-crypto/{base}/{quote}/configure` — Configure both markups for an existing swap pair */
export async function postConfigureSwapCryptoRate(
  base: string,
  quote: string,
  body: { markupType: string; baseMarkupRate: number; quoteMarkupRate: number }
): Promise<void> {
  await adminRequest(`/admin/rates/swap-crypto/${encodeURIComponent(base)}/${encodeURIComponent(quote)}/configure`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** `POST /admin/rates/gift-card/{configId}/configure` — Configure a gift card rate */
export async function postConfigureGiftcardRate(
  configId: string,
  body: {
    rmbRate: string;
    markupType: string;
    markupRate: number;
    denominations: { id: string; label: string; vendorRate: number }[];
  }
): Promise<void> {
  await adminRequest(`/admin/rates/gift-card/${encodeURIComponent(configId)}/configure`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** `POST /admin/rates/swap-pairs` — Create a new crypto swap pair */
export async function postCreateSwapPair(body: {
  base: string;
  quote: string;
  markupType: string;
  baseMarkupRate: number;
  quoteMarkupRate: number;
}): Promise<void> {
  await adminRequest("/admin/rates/swap-pairs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** `POST /admin/rates/sheets` — Upload a gift card rate sheet from a CSV URL */
export async function postUploadRateSheet(body: { csvUrl: string }): Promise<void> {
  await adminRequest("/admin/rates/sheets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
