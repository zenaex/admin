import { adminRequest } from "@/lib/admin-api/client";
import { formatNgnMajor, koboToMajor } from "@/lib/admin-api/money";
import {
  buildMarkupConfigurePayload,
  parseRmbRate,
  parseRmbRateNumber,
  resolveCryptoSlug,
  resolveSwapCryptoCode,
  slugToCryptoTicker,
} from "@/lib/admin-api/rates-payload";
import type {
  ExchangeRateRow,
  ExchangeRateSubTab,
  GiftcardBrand,
  GiftcardDenomination,
  SwapPairMeta,
} from "@/components/product-mgt/product-mgt-types";

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

function pickScalar(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
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
  for (const key of [
    "items",
    "rates",
    "pairs",
    "swapPairs",
    "swap_pairs",
    "results",
    "rows",
    "records",
    "list",
    "content",
    "data",
    "brands",
  ]) {
    const v = rec[key];
    if (Array.isArray(v)) return v;
  }
  return null;
}

function pickNestedRecord(o: Record<string, unknown>, keys: string[]): Record<string, unknown> | null {
  for (const k of keys) {
    const rec = asRecord(o[k]);
    if (rec) return rec;
  }
  return null;
}

function cryptoAssetDisplay(
  asset: Record<string, unknown> | null,
  slugHint: string,
): { code: string; name: string } {
  const slug =
    slugHint.trim() ||
    pickString(asset ?? {}, ["slug", "cryptoSlug", "crypto_slug", "id"]) ||
    "";
  const symbol = pickString(asset ?? {}, ["symbol", "code", "ticker", "currencyCode", "currency"]);
  const name = pickString(asset ?? {}, ["name", "displayName", "title", "label"]);
  const code = symbol ? symbol.toUpperCase() : slugToCryptoTicker(slug);
  return {
    code,
    name: name || code,
  };
}

function extractSwapPairMeta(o: Record<string, unknown>): SwapPairMeta | undefined {
  const baseAsset =
    pickNestedRecord(o, [
      "baseCrypto",
      "base_crypto",
      "baseAsset",
      "base_asset",
      "fromCrypto",
      "from_crypto",
    ]) ?? (typeof o.base === "object" ? asRecord(o.base) : null);
  const quoteAsset =
    pickNestedRecord(o, [
      "quoteCrypto",
      "quote_crypto",
      "quoteAsset",
      "quote_asset",
      "toCrypto",
      "to_crypto",
    ]) ?? (typeof o.quote === "object" ? asRecord(o.quote) : null);

  const baseSlug =
    pickString(o, ["baseCryptoSlug", "base_crypto_slug", "baseSlug", "base_slug"]) ||
    (typeof o.base === "string" ? o.base : "");
  const quoteSlug =
    pickString(o, ["quoteCryptoSlug", "quote_crypto_slug", "quoteSlug", "quote_slug"]) ||
    (typeof o.quote === "string" ? o.quote : "");

  const base = cryptoAssetDisplay(baseAsset, baseSlug);
  const quote = cryptoAssetDisplay(quoteAsset, quoteSlug);

  if (!base.code || !quote.code) {
    const flatBase = pickString(o, ["baseCode", "base_code", "baseCurrency"]);
    const flatQuote = pickString(o, ["quoteCode", "quote_code", "quoteCurrency"]);
    const baseCode = slugToCryptoTicker(flatBase) || flatBase.toUpperCase();
    const quoteCode = slugToCryptoTicker(flatQuote) || flatQuote.toUpperCase();
    if (!baseCode || !quoteCode) return undefined;
    return {
      baseCode,
      baseName: pickString(o, ["baseName", "base_name", "baseCurrencyName"]) || baseCode,
      quoteCode,
      quoteName: pickString(o, ["quoteName", "quote_name", "quoteCurrencyName"]) || quoteCode,
    };
  }

  return {
    baseCode: base.code,
    baseName: base.name,
    quoteCode: quote.code,
    quoteName: quote.name,
  };
}

function formatSwapCryptoCommission(o: Record<string, unknown>): {
  commissionType: string;
  ourCommission: string;
} {
  const commissionType = humanizeCommissionType(
    pickString(o, ["markupType", "markup_type", "commissionType", "commission_type"]) || "percentage",
  );

  const baseToQuote = pickNum(o, [
    "baseToQuoteMarkupValue",
    "base_to_quote_markup_value",
    "baseToQuoteMarkup",
    "base_to_quote_markup",
    "baseMarkupValue",
    "base_markup_value",
  ]);
  const quoteToBase = pickNum(o, [
    "quoteToBaseMarkupValue",
    "quote_to_base_markup_value",
    "quoteToBaseMarkup",
    "quote_to_base_markup",
    "quoteMarkupValue",
    "quote_markup_value",
  ]);

  if (baseToQuote !== undefined || quoteToBase !== undefined) {
    const left = formatCommissionValue(commissionType, String(baseToQuote ?? 0));
    const right = formatCommissionValue(commissionType, String(quoteToBase ?? baseToQuote ?? 0));
    return { commissionType, ourCommission: `${left} | ${right}` };
  }

  const commissionRateVal = pickMarkupValue(o);
  if (commissionRateVal) {
    return {
      commissionType,
      ourCommission: formatCommissionValue(commissionType, commissionRateVal),
    };
  }

  return { commissionType, ourCommission: "—" };
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
    pickNum(r, ["total", "totalCount", "count", "totalItems", "totalElements", "limit"]) ??
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
    const major = koboToMajor(parseFloat(cleaned));
    return `${formatNgnMajor(major)} FLAT`;
  }
  return cleaned;
}

const FIAT_CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar",
  NGN: "Nigeria Naira",
  GHS: "Ghana Cedi",
  GBP: "British Pound",
  EUR: "Euro",
};

function fiatCurrencyDisplayName(code: string): string {
  const c = code.trim().toUpperCase();
  return FIAT_CURRENCY_NAMES[c] ?? c;
}

function pickMarkupValue(o: Record<string, unknown>): string {
  const direct = pickString(o, [
    "markupValue",
    "markup_value",
    "markupRate",
    "markup_rate",
    "ourCommission",
    "our_commission",
    "commissionRate",
    "commission",
    "rate",
  ]);
  if (direct) return direct;
  const num = pickNum(o, ["markupValue", "markup_value", "markupRate", "markup_rate"]);
  if (num !== undefined) return String(num);
  return "";
}

function resolveFiatPairDisplay(baseCurrency: string, quoteCurrency: string) {
  const base = baseCurrency.trim().toUpperCase() || "NGN";
  const quote = quoteCurrency.trim().toUpperCase() || "USD";
  if (base === "NGN") {
    return { currencyCode: quote, currencyName: fiatCurrencyDisplayName(quote), fiatBase: base, fiatQuote: quote };
  }
  if (quote === "NGN") {
    return { currencyCode: base, currencyName: fiatCurrencyDisplayName(base), fiatBase: base, fiatQuote: quote };
  }
  return { currencyCode: quote, currencyName: fiatCurrencyDisplayName(quote), fiatBase: base, fiatQuote: quote };
}

function normalizeExchangeRateRow(raw: unknown, index: number, subTab: ExchangeRateSubTab): ExchangeRateRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  let swapPair: SwapPairMeta | undefined;
  if (subTab === "swap-crypto") {
    swapPair = extractSwapPairMeta(o);
    if (!swapPair) return null;
  }

  let id =
    pickString(o, ["id", "rateId", "rate_id", "pairId", "pair_id", "uuid"]) ||
    (swapPair ? `rate-swap-${swapPair.baseCode}-${swapPair.quoteCode}`.toLowerCase() : "") ||
    `rate-${subTab}-${index}`;

  const baseCurrency = pickString(o, ["baseCurrency", "base_currency", "baseCode", "base_code"]);
  const quoteCurrency = pickString(o, ["quoteCurrency", "quote_currency", "quoteCode", "quote_code"]);

  let currencyCode = pickString(o, ["currencyCode", "currency_code", "code", "symbol"]) || "";
  let currencyName = pickString(o, ["currencyName", "currency_name", "name", "title"]) || "";
  let fiatBase: string | undefined;
  let fiatQuote: string | undefined;

  if (subTab === "fiat" && (baseCurrency || quoteCurrency)) {
    const pair = resolveFiatPairDisplay(baseCurrency || "NGN", quoteCurrency || currencyCode || "USD");
    currencyCode = pair.currencyCode;
    currencyName = pair.currencyName;
    fiatBase = pair.fiatBase;
    fiatQuote = pair.fiatQuote;
  } else if (swapPair) {
    currencyCode = `${swapPair.baseCode} ⇆ ${swapPair.quoteCode}`;
    currencyName = `${swapPair.baseName} & ${swapPair.quoteName}`;
  } else {
    currencyCode = currencyCode || pickString(o, ["base"]) || "—";
    currencyName = currencyName || currencyCode;
  }

  const countryCode = pickString(o, ["countryCode", "country_code", "country"]) || null;

  let commissionType = humanizeCommissionType(
    pickString(o, ["commissionType", "commission_type", "markupType", "markup_type"]),
  );
  let ourCommission = "—";
  if (subTab === "swap-crypto") {
    const swapCommission = formatSwapCryptoCommission(o);
    commissionType = swapCommission.commissionType;
    ourCommission = swapCommission.ourCommission;
  } else {
    const commissionRateVal = pickMarkupValue(o);
    ourCommission = commissionRateVal ? formatCommissionValue(commissionType, commissionRateVal) : "—";
  }

  const baseRateVal =
    subTab === "swap-crypto"
      ? pickString(o, ["baseRate", "base_rate"])
      : pickString(o, ["baseRate", "base_rate", "base"]);
  const baseRate = baseRateVal ? (baseRateVal.includes("/") ? baseRateVal : `1/${baseRateVal}`) : "—";

  const finalRateVal =
    subTab === "swap-crypto"
      ? pickString(o, ["finalRate", "final_rate", "final"])
      : pickString(o, ["finalRate", "final_rate", "rate", "final"]);
  const finalRate = finalRateVal ? (finalRateVal.includes("/") ? finalRateVal : `1/${finalRateVal}`) : "—";

  const updatedAtRaw = pickString(o, [
    "dateUpdated",
    "date_updated",
    "updatedAt",
    "updated_at",
    "modifiedAt",
    "lastUpdated",
    "last_updated",
  ]);
  const dateUpdated = updatedAtRaw ? formatDisplayDate(updatedAtRaw) : "—";

  const cryptoSlug =
    subTab === "sell-crypto"
      ? pickString(o, ["cryptoSlug", "crypto_slug", "slug", "assetSlug"]) ||
        resolveCryptoSlug(currencyCode, pickString(o, ["cryptoSlug", "slug"]))
      : undefined;

  const iconUrl =
    pickString(o, ["logo", "iconUrl", "icon_url", "icon", "imageUrl", "image_url"]) || undefined;

  return {
    id,
    currencyCode,
    currencyName,
    countryCode,
    fiatBase,
    fiatQuote,
    commissionType,
    ourCommission,
    baseRate,
    finalRate,
    dateUpdated,
    swapPair,
    cryptoSlug,
    iconUrl,
  };
}

function isMeaningfulGiftcardDenomination(d: {
  label: string;
  vendorRate: string;
  finalRate: string;
}): boolean {
  const label = d.label.trim();
  if (label && label !== "—") return true;
  const vendor = d.vendorRate.trim();
  const final = d.finalRate.trim();
  return (vendor !== "" && vendor !== "—") || (final !== "" && final !== "—");
}

function humanizeGiftcardBrandType(raw: string): "E-code" | "Physical" {
  const t = raw.trim().toLowerCase();
  if (!t) return "E-code";
  if (t.includes("physical")) return "Physical";
  if (t.includes("ecode") || t.includes("e-code") || t === "e_code") return "E-code";
  return "E-code";
}

function formatGiftcardRmbRate(raw: string): string {
  const t = raw.trim();
  if (!t) return "—";
  if (t.startsWith("¥") || t.startsWith("$") || t.startsWith("₦")) return t;
  const n = Number(t);
  if (Number.isFinite(n)) return `¥${n}`;
  return t;
}

function formatGiftcardVendorRate(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("$") || t.startsWith("¥") || t.startsWith("₦")) return t;
  const n = Number(t);
  if (Number.isFinite(n)) {
    // Bug #52: Rates returned from backend in minor units — divide by 100
    const major = n / 100;
    return `$${major}`;
  }
  return t;
}

function formatGiftcardFinalRate(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.includes("/")) return t;
  const n = Number(t);
  if (Number.isFinite(n)) {
    // Bug #52: Rates returned from backend in minor units — divide by 100
    const major = n / 100;
    return `$1/₦${major.toLocaleString()}`;
  }
  return t;
}

function pickGiftcardDenomStatus(rec: Record<string, unknown>): "Active" | "Inactive" {
  const active = rec.isActive ?? rec.is_active;
  if (typeof active === "boolean") return active ? "Active" : "Inactive";
  const status = pickString(rec, ["status", "denomStatus"]).toLowerCase();
  if (status === "inactive" || status === "disabled") return "Inactive";
  return "Active";
}

function normalizeGiftcardBrand(raw: unknown, index: number): GiftcardBrand | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id = pickString(o, ["id", "configId", "config_id", "uuid"]) || `gc-brand-${index}`;
  const brandName = pickString(o, ["brandName", "brand_name", "name", "title"]) || "—";
  const rawType = pickString(o, ["type", "brandType", "brand_type", "cardType", "card_type"]);
  const brandType = humanizeGiftcardBrandType(rawType);
  const currency = pickString(o, ["currency", "currencyCode", "currency_code"]).toUpperCase();
  const country = pickString(o, ["country", "brandCountry"]) || "—";
  const countryCode =
    pickString(o, ["countryCode", "country_code"]) || currency || "—";

  const commissionType = humanizeCommissionType(
    pickString(o, ["commissionType", "commission_type", "markupType", "markup_type"]),
  );
  const commissionRateVal = pickMarkupValue(o);
  const ourCommission = commissionRateVal ? formatCommissionValue(commissionType, commissionRateVal) : "—";

  const rmbRateRaw = pickScalar(o, ["rmbRate", "rmb_rate", "rmb"]);
  const rmbRate = formatGiftcardRmbRate(rmbRateRaw);
  const iconUrl =
    pickString(o, ["logo", "iconUrl", "icon_url", "icon", "imageUrl", "image_url"]) || undefined;

  const denomsRaw =
    o.categories ??
    o.denominations ??
    o.subCategories ??
    o.sub_categories ??
    o.subProducts ??
    o.sub_products ??
    [];
  const denominations = (Array.isArray(denomsRaw) ? denomsRaw : [])
    .map((d: unknown, dIdx: number) => {
      const doRecord = asRecord(d) || {};
      const category =
        pickScalar(doRecord, ["category", "categoryName", "category_name"]) || "";
      const dId =
        pickString(doRecord, ["id", "denomId", "uuid"]) ||
        (category ? `${id}-${category}` : `denom-${dIdx}`);
      const label =
        pickScalar(doRecord, [
          "label",
          "name",
          "title",
          "subCategoryName",
          "sub_category_name",
          "amountRange",
          "amount_range",
          "range",
          "denomination",
          "value",
          "description",
        ]) ||
        category ||
        "";
      const vendorRate = formatGiftcardVendorRate(
        pickScalar(doRecord, ["vendorRate", "vendor_rate", "rate"]),
      );
      const finalRate = formatGiftcardFinalRate(
        pickScalar(doRecord, ["finalRate", "final_rate", "final"]),
      );
      const dUpdatedAtRaw = pickScalar(doRecord, [
        "updatedAt",
        "updated_at",
        "dateUpdated",
        "date_updated",
      ]);
      const dateUpdated = dUpdatedAtRaw ? formatDisplayDate(dUpdatedAtRaw) : "—";
      const status = pickGiftcardDenomStatus(doRecord);

      return {
        id: dId,
        category: category || label,
        label: label || category,
        vendorRate,
        finalRate,
        dateUpdated,
        status,
      };
    })
    .filter(isMeaningfulGiftcardDenomination);

  return {
    id,
    brandName,
    brandType,
    country,
    countryCode,
    currency: currency || undefined,
    cardType: rawType || undefined,
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

async function fetchSwapCryptoItemsRaw(): Promise<{ itemsRaw: unknown[]; body: unknown }> {
  const paths = ["/admin/rates/swap-crypto", "/admin/rates/swap-pairs"];
  let lastBody: unknown = null;
  for (const path of paths) {
    const body = await adminRequest<unknown>(path, { method: "GET" });
    const itemsRaw = extractItemsArray(body);
    if (itemsRaw.length > 0) return { itemsRaw, body };
    lastBody = body;
  }
  return { itemsRaw: extractItemsArray(lastBody), body: lastBody ?? {} };
}

/** `GET /admin/rates/{subTab}` — List rates for fiat, sell-crypto, swap-crypto, etc. */
export async function getExchangeRates(subTab: ExchangeRateSubTab): Promise<ExchangeRateListResult> {
  const pathMap: Record<ExchangeRateSubTab, string> = {
    fiat: "/admin/rates/fiat",
    "sell-crypto": "/admin/rates/sell-crypto",
    "swap-crypto": "/admin/rates/swap-crypto",
    giftcard: "/admin/rates/gift-card",
  };

  let body: unknown;
  let itemsRaw: unknown[];
  if (subTab === "swap-crypto") {
    const res = await fetchSwapCryptoItemsRaw();
    body = res.body;
    itemsRaw = res.itemsRaw;
  } else {
    const path = pathMap[subTab] ?? "/admin/rates/fiat";
    body = await adminRequest<unknown>(path, { method: "GET" });
    itemsRaw = extractItemsArray(body);
  }

  const items = itemsRaw
    .map((raw, idx) => normalizeExchangeRateRow(raw, idx, subTab))
    .filter((x): x is ExchangeRateRow => x !== null);
  const total = extractTotal(body, items.length);
  return { items, total };
}

/** `GET /admin/rates/gift-card` — List gift card brand rates */
export async function getGiftcardRates(): Promise<GiftcardBrand[]> {
  // Request a large page size to ensure the full list is returned (Bug #51)
  const body = await adminRequest<unknown>("/admin/rates/gift-card?pageSize=200&page=1", { method: "GET" });
  const itemsRaw = extractItemsArray(body);
  return itemsRaw.map((raw, idx) => normalizeGiftcardBrand(raw, idx)).filter((x): x is GiftcardBrand => x !== null);
}

/** `POST /admin/rates/fiat/{base}/{quote}/configure` — Configure fiat markup for a currency pair */
export async function postConfigureFiatRate(
  base: string,
  quote: string,
  input: { markupType: string; markupRate: string | number; markupCap?: number },
): Promise<void> {
  const payload = buildMarkupConfigurePayload(input.markupType, input.markupRate, input.markupCap);
  await adminRequest(`/admin/rates/fiat/${encodeURIComponent(base)}/${encodeURIComponent(quote)}/configure`, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

/** `POST /admin/rates/sell-crypto/{cryptoSlug}/configure` — Configure markup for selling a crypto asset */
export async function postConfigureSellCryptoRate(
  cryptoSlug: string,
  input: { markupType: string; markupRate: string | number; markupCap?: number },
): Promise<void> {
  const slug = resolveCryptoSlug(cryptoSlug);
  const payload = buildMarkupConfigurePayload(input.markupType, input.markupRate, input.markupCap);
  await adminRequest(`/admin/rates/sell-crypto/${encodeURIComponent(slug)}/configure`, {
    method: "POST",
    body: JSON.stringify(payload),
    auth: true,
  });
}

/** `POST /admin/rates/swap-crypto/{base}/{quote}/configure` — Configure both markups for an existing swap pair */
export async function postConfigureSwapCryptoRate(
  base: string,
  quote: string,
  input: { baseToQuoteMarkupValue: number; quoteToBaseMarkupValue: number },
): Promise<void> {
  await adminRequest(
    `/admin/rates/swap-crypto/${encodeURIComponent(resolveSwapCryptoCode(base))}/${encodeURIComponent(resolveSwapCryptoCode(quote))}/configure`,
    {
      method: "POST",
      body: JSON.stringify({
        baseToQuoteMarkupValue: input.baseToQuoteMarkupValue,
        quoteToBaseMarkupValue: input.quoteToBaseMarkupValue,
      }),
      auth: true,
    },
  );
}

export type GiftcardRateCategoryInput = {
  category: string;
  vendorRate: number;
  isActive: boolean;
};

export function parseGiftcardVendorRateNumber(display: string): number {
  const n = parseFloat(display.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function parseGiftcardMarkupRateForConfigure(ourCommission: string): string | number {
  const cleaned = ourCommission.replace(/[^\d.]/g, "");
  return cleaned || "0";
}

/** Build configure body from current brand state (optionally override category active flags). */
export function buildGiftcardConfigurePayload(
  brand: GiftcardBrand,
  options?: { categoryActiveById?: Record<string, boolean> },
): {
  rmbRate: string | number;
  markupType: string;
  markupRate: string | number;
  categories: GiftcardRateCategoryInput[];
} {
  return {
    rmbRate: parseRmbRateNumber(brand.rmbRate),
    markupType: brand.commissionType,
    markupRate: parseGiftcardMarkupRateForConfigure(brand.ourCommission),
    categories: brand.denominations.map((d) => ({
      category: d.category || d.label,
      vendorRate: parseGiftcardVendorRateNumber(d.vendorRate),
      isActive:
        options?.categoryActiveById?.[d.id] !== undefined
          ? options.categoryActiveById[d.id]
          : d.status === "Active",
    })),
  };
}

export async function toggleGiftcardCategoryActive(
  brand: GiftcardBrand,
  denomination: GiftcardDenomination,
  isActive: boolean,
): Promise<void> {
  const payload = buildGiftcardConfigurePayload(brand, {
    categoryActiveById: { [denomination.id]: isActive },
  });
  await postConfigureGiftcardRate(brand.id, payload);
}

/** `POST /admin/rates/gift-card/{configId}/configure` — Configure a gift card rate */
export async function postConfigureGiftcardRate(
  configId: string,
  input: {
    rmbRate: string | number;
    markupType: string;
    markupRate: string | number;
    categories: GiftcardRateCategoryInput[];
  },
): Promise<void> {
  const { markupType, markupValue } = buildMarkupConfigurePayload(input.markupType, input.markupRate);
  await adminRequest(`/admin/rates/gift-card/${encodeURIComponent(configId)}/configure`, {
    method: "POST",
    body: JSON.stringify({
      rmbRate: parseRmbRateNumber(input.rmbRate),
      markupType,
      markupValue,
      categories: input.categories.map((c) => ({
        category: c.category,
        vendorRate: Math.round(c.vendorRate * 100),
        isActive: c.isActive,
      })),
    }),
    auth: true,
  });
}

/** `POST /admin/rates/swap-pairs` — Create a new crypto swap pair */
export async function postCreateSwapPair(body: {
  baseCryptoSlug: string;
  quoteCryptoSlug: string;
  baseToQuoteMarkupValue: number;
  quoteToBaseMarkupValue: number;
}): Promise<void> {
  await adminRequest("/admin/rates/swap-pairs", {
    method: "POST",
    body: JSON.stringify({
      baseCryptoSlug: resolveSwapCryptoCode(body.baseCryptoSlug),
      quoteCryptoSlug: resolveSwapCryptoCode(body.quoteCryptoSlug),
      baseToQuoteMarkupValue: body.baseToQuoteMarkupValue,
      quoteToBaseMarkupValue: body.quoteToBaseMarkupValue,
    }),
    auth: true,
  });
}



/** `POST /admin/rates/sheets` — Upload a gift card rate sheet from a publicly accessible CSV URL */
export async function postUploadRateSheet(body: { csvUrl: string }): Promise<void> {
  const csvUrl = body.csvUrl.trim();
  if (!csvUrl) throw new Error("CSV URL is required.");
  await adminRequest("/admin/rates/sheets", {
    method: "POST",
    body: JSON.stringify({ csvUrl }),
    auth: true,
  });
}

/** `GET /admin/rates/fiat/{base}/{quote}/base-rate` — Fetch live Base Rate for a fiat pair */
export async function getAdminLiveBaseRate(base: string, quote: string): Promise<number> {
  try {
    const body = await adminRequest<unknown>(`/admin/rates/fiat/${encodeURIComponent(base)}/${encodeURIComponent(quote)}/base-rate`, { method: "GET" });
    const r = asRecord(body);
    const inner = r ? (asRecord(r.data) ?? r) : {};
    return pickNum(inner, ["baseRate", "base_rate", "rate"]) ?? 0;
  } catch (e) {
    console.error(`Failed to fetch live base rate for fiat pair ${base}/${quote}:`, e);
    return 0;
  }
}

/** `GET /rates/fiat` — Get the converted fiat rate for a given amount and currency pair */
export async function getPublicFiatRate(query: { amount: number; base: string; quote: string }): Promise<unknown> {
  const qs = buildQuery({
    amount: query.amount,
    base: query.base,
    quote: query.quote,
  });
  // Strip '/admin' if the client or URL base has it, to target public path safely
  return adminRequest<unknown>(`/rates/fiat${qs}`, { method: "GET" });
}

/** `GET /rates/crypto` — Get the swap rate for a given amount and crypto asset pair */
export async function getPublicCryptoRate(query: { amount: number; base: string; quote: string }): Promise<unknown> {
  const qs = buildQuery({
    amount: query.amount,
    base: query.base,
    quote: query.quote,
  });
  return adminRequest<unknown>(`/rates/crypto${qs}`, { method: "GET", auth: false });
}

/** `GET /rates/gift-card` — Get the current buy rate for a gift card provider/currency */
export async function getPublicGiftcardRate(query: { provider: string; currency: string }): Promise<unknown> {
  const qs = buildQuery({
    provider: query.provider,
    currency: query.currency,
  });
  return adminRequest<unknown>(`/rates/gift-card${qs}`, { method: "GET", auth: false });
}

/** `GET /rates/sell-crypto` — Get the markup applied when selling a crypto asset back to the platform */
export async function getPublicSellCryptoRate(query: { cryptoSlug: string }): Promise<unknown> {
  const qs = buildQuery({
    cryptoSlug: query.cryptoSlug,
  });
  return adminRequest<unknown>(`/rates/sell-crypto${qs}`, { method: "GET", auth: false });
}

export { parseRmbRate };

export function getCurrencySymbol(currency?: string): string {
  const code = (currency || "USD").trim().toUpperCase();
  switch (code) {
    case "USD":
      return "$";
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    case "CAD":
      return "C$";
    case "GHS":
      return "₵";
    default:
      return "$";
  }
}

export type GiftcardPreviewCategoryInput = {
  category: string;
  vendorRate: number;
};

export type GiftcardPreviewCategoryResult = {
  category: string;
  vendorRate: number;
  finalRate: number;
};

export type GiftcardPreviewInput = {
  rmbRate: number;
  markupType: string;
  markupRate: number;
  categories: GiftcardPreviewCategoryInput[];
};

export type GiftcardPreviewResponse = {
  rmbRate: number;
  markupValue: number;
  categories: GiftcardPreviewCategoryResult[];
};

export async function getGiftcardRatePreview(input: GiftcardPreviewInput): Promise<GiftcardPreviewResponse> {
  const isFlat = input.markupType.trim().toLowerCase() === "flat";
  const markupValue = isFlat ? Math.round(input.markupRate * 100) : 0;

  const response = await adminRequest<GiftcardPreviewResponse>("/admin/rates/gift-card/preview", {
    method: "POST",
    body: JSON.stringify({
      rmbRate: input.rmbRate,
      markupValue,
      categories: input.categories.map((c) => ({
        category: c.category,
        vendorRate: Math.round(c.vendorRate * 100),
      })),
    }),
    auth: true,
  });

  if (!isFlat) {
    const isCapped = input.markupType.trim().toLowerCase().includes("capped");
    response.categories = response.categories.map((c) => {
      const baseRateKobo = c.finalRate;
      let markupKobo = (baseRateKobo * input.markupRate) / 100;
      if (isCapped) {
        markupKobo = Math.min(markupKobo, 5000);
      }
      return {
        ...c,
        finalRate: Math.round(baseRateKobo - markupKobo),
      };
    });
  }

  return response;
}

