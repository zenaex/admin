import { adminRequest } from "@/lib/admin-api/client";
import { formatNgnMajor, koboToMajor } from "@/lib/admin-api/money";
import type { ProductRow, ProductStatus, ProductMgtStats } from "@/components/product-mgt/product-mgt-types";

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
  for (const key of ["items", "products", "results", "rows", "records", "list", "content", "data"]) {
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

  const inner = r.data ?? r.items ?? r.results ?? r.products ?? r.rows ?? r.records ?? r.list;
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

function extractPageInfo(data: unknown, requestedPage: number, requestedPageSize: number) {
  const r = asRecord(data);
  const meta = r ? asRecord(r.meta) : null;
  const dataInner = r ? asRecord(r.data) : null;
  const pagination = (r ? asRecord(r.pagination) : null) ?? (dataInner ? asRecord(dataInner.pagination) : null);
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

function formatMinorUnits(value: number): string {
  return formatNgnMajor(koboToMajor(value));
}

function mapChargeType(apiType: string): string {
  const t = apiType.trim().toLowerCase();
  if (t === "percentage_with_cap" || t === "percentage-with-cap") return "% capped @";
  if (t === "percentage") return "Percentage";
  if (t === "flat") return "Flat";
  return "None";
}

function formatChargeDisplay(
  chargeType: string,
  chargeValue: number | undefined,
  chargeCap: number | undefined,
): { commissionRate: string; cap: string } {
  const t = chargeType.trim().toLowerCase();
  if (t === "none" || !t) return { commissionRate: "—", cap: "—" };
  if (t === "percentage") {
    const rate = chargeValue !== undefined ? `${chargeValue}%` : "—";
    return { commissionRate: rate, cap: "—" };
  }
  if (t === "percentage_with_cap" || t === "percentage-with-cap") {
    const rate = chargeValue !== undefined ? `${chargeValue}%` : "—";
    const cap = chargeCap !== undefined && chargeCap > 0 ? formatMinorUnits(chargeCap) : "—";
    return { commissionRate: rate, cap };
  }
  if (t === "flat") {
    const rate = chargeValue !== undefined ? formatMinorUnits(chargeValue) : "—";
    return { commissionRate: rate, cap: "—" };
  }
  if (chargeValue !== undefined) return { commissionRate: String(chargeValue), cap: "—" };
  return { commissionRate: "—", cap: "—" };
}

function humanizeCategorySlug(slug: string): string {
  const t = slug.trim();
  if (!t) return "—";
  return t
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDisplayDate(isoOrAny: string): string {
  if (!isoOrAny) return "—";
  const d = new Date(isoOrAny);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return isoOrAny;
}

function normalizeProductRow(raw: unknown, index: number): ProductRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickString(o, ["slug", "productSlug", "product_slug", "id"]) || `product-${index}`;
  const productName = pickString(o, ["name", "productName", "product_name", "title"]) || id;
  const categorySlug = pickString(o, ["categorySlug", "category_slug", "category", "productCategory"]);
  const productCategory = categorySlug ? humanizeCategorySlug(categorySlug) : "—";

  const chargeTypeRaw = pickString(o, ["chargeType", "charge_type", "commissionType"]) || "none";
  const chargeValue = pickNum(o, ["chargeValue", "charge_value", "commissionRate", "rate"]);
  const chargeCap = pickNum(o, ["chargeCap", "charge_cap", "cap"]);
  const { commissionRate, cap } = formatChargeDisplay(chargeTypeRaw, chargeValue, chargeCap);

  const switchProvider = pickString(o, ["activeProvider", "active_provider", "switchProvider", "provider", "providerName"]) || "—";

  const statusRaw = pickString(o, ["status", "productStatus", "isActive"]);
  let status: ProductStatus = "Active";
  if (statusRaw.toLowerCase() === "inactive" || statusRaw.toLowerCase() === "disabled" || o.isActive === false || o.active === false) {
    status = "Inactive";
  }

  return {
    id,
    productName,
    productCategory,
    commissionType: mapChargeType(chargeTypeRaw),
    commissionRate,
    cap,
    switchProvider,
    status,
  };
}

export type ProductListResult = {
  items: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
};

/** OpenAPI product category filter for utility bills (electricity, internet, etc.). */
export const UTILITY_PRODUCT_CATEGORY = "utility";

const NON_UTILITY_CATEGORY_TOKENS = [
  "crypto",
  "gift-card",
  "giftcard",
  "gift_card",
  "esim",
  "e-sim",
  "e_sim",
];

function normalizeCategoryToken(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

function pickProductCategoryTokens(o: Record<string, unknown>): string[] {
  const keys = [
    "parentCategorySlug",
    "parent_category_slug",
    "parentCategory",
    "parent_category",
    "categorySlug",
    "category_slug",
    "category",
    "productCategory",
    "type",
  ];
  const tokens: string[] = [];
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) tokens.push(normalizeCategoryToken(v));
  }
  return tokens;
}

function isNonUtilityCategoryToken(token: string): boolean {
  return NON_UTILITY_CATEGORY_TOKENS.some(
    (excluded) => token === excluded || token.includes(excluded),
  );
}

/** True for utility parent/subcategories; excludes crypto, gift card, and e-sim. */
export function isUtilityProductRaw(raw: unknown): boolean {
  const o = asRecord(raw);
  if (!o) return false;

  const parent = normalizeCategoryToken(
    pickString(o, ["parentCategorySlug", "parent_category_slug", "parentCategory", "parent_category"]),
  );
  if (parent === "utility") return true;
  if (parent && parent !== "utility") return false;

  const tokens = pickProductCategoryTokens(o);
  if (tokens.length === 0) return false;

  if (tokens.some((token) => token === "utility")) return true;
  if (tokens.some(isNonUtilityCategoryToken)) return false;

  return true;
}

export type ProductListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  provider?: string;
  commissionType?: string;
  category?: string;
};

async function fetchAllProductsRaw(
  query: Omit<ProductListQuery, "page" | "pageSize" | "category">,
): Promise<unknown[]> {
  const all: unknown[] = [];
  let fetchPage = 1;
  const fetchSize = 100;

  while (fetchPage <= 50) {
    const qs = buildQuery({
      page: fetchPage,
      pageSize: fetchSize,
      search: query.search,
      status: query.status?.toLowerCase(),
      provider: query.provider,
      commissionType: query.commissionType,
    });
    const body = await adminRequest<unknown>(`/admin/products${qs}`, { method: "GET" });
    const batch = extractItemsArray(body);
    all.push(...batch);
    const total = extractTotal(body, all.length);
    if (batch.length === 0 || all.length >= total) break;
    fetchPage += 1;
  }

  return all;
}

/** `GET /admin/products` — List products with filters */
export async function getAdminProductsList(query?: ProductListQuery): Promise<ProductListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const utilityOnly = query?.category === UTILITY_PRODUCT_CATEGORY;

  if (utilityOnly) {
    const allRaw = await fetchAllProductsRaw({
      search: query?.search,
      status: query?.status,
      provider: query?.provider,
      commissionType: query?.commissionType,
    });
    const utilityRaw = allRaw.filter(isUtilityProductRaw);
    const items = utilityRaw
      .map((raw, idx) => normalizeProductRow(raw, idx))
      .filter((x): x is ProductRow => x !== null);
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
    };
  }

  const qs = buildQuery({
    page,
    pageSize,
    search: query?.search,
    status: query?.status?.toLowerCase(),
    provider: query?.provider,
    commissionType: query?.commissionType,
    category: query?.category,
  });
  const body = await adminRequest<unknown>(`/admin/products${qs}`, { method: "GET" });
  const itemsRaw = extractItemsArray(body);
  const items = itemsRaw.map((raw, idx) => normalizeProductRow(raw, idx)).filter((x): x is ProductRow => x !== null);
  const total = extractTotal(body, items.length);

  return { items, total, page, pageSize };
}

/** Legacy signature for compatibility */
export async function getProductMgtList(): Promise<ProductListResult> {
  return getAdminProductsList({ page: 1, pageSize: 100, category: UTILITY_PRODUCT_CATEGORY });
}

/** `GET /admin/products/summary` — Product summary cards (counts) */
export async function getAdminProductsSummary(): Promise<ProductMgtStats> {
  try {
    const body = await adminRequest<unknown>("/admin/products/summary", { method: "GET" });
    const r = asRecord(body);
    const inner = r ? (asRecord(r.data) ?? r) : {};
    return {
      totalProducts: String(pickNum(inner, ["totalProducts", "total_products", "totalCount", "total"]) ?? "0"),
      activeProducts: String(pickNum(inner, ["activeProducts", "active_products", "activeCount", "active"]) ?? "0"),
      totalCrypto: String(pickNum(inner, ["totalCrypto", "total_crypto", "cryptoCount", "crypto"]) ?? "0"),
      totalCurrencies: String(
        pickNum(inner, ["totalCurrencies", "total_currencies", "currenciesCount", "currencies"]) ?? "0",
      ),
    };
  } catch (e) {
    console.error("Failed to fetch products summary, returning fallbacks:", e);
    return {
      totalProducts: "—",
      activeProducts: "—",
      totalCrypto: "—",
      totalCurrencies: "—",
    };
  }
}

/** `PATCH /admin/products/{productSlug}/toggle` — Activate / deactivate a product */
export async function patchAdminProductToggle(productSlug: string, active: boolean): Promise<void> {
  await adminRequest(`/admin/products/${encodeURIComponent(productSlug)}/toggle`, {
    method: "PATCH",
    body: JSON.stringify({ active, isActive: active }),
  });
}

/** `PATCH /admin/products/{productSlug}/switch-provider` — Switch the active provider for a product */
export async function patchAdminProductSwitchProvider(productSlug: string, provider: string): Promise<void> {
  await adminRequest(`/admin/products/${encodeURIComponent(productSlug)}/switch-provider`, {
    method: "PATCH",
    body: JSON.stringify({ provider, providerId: provider, providerName: provider }),
  });
}

/** `PATCH /admin/products/{productSlug}/commission` — Update product commission */
export async function patchAdminProductCommission(
  productSlug: string,
  body: { chargeType: string; chargeValue: number; chargeCap?: number },
): Promise<void> {
  await adminRequest(`/admin/products/${encodeURIComponent(productSlug)}/commission`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** `GET /admin/products/{productSlug}/providers` — List providers supporting this product */
export async function getAdminProductProviders(productSlug: string): Promise<string[]> {
  try {
    const body = await adminRequest<unknown>(`/admin/products/${encodeURIComponent(productSlug)}/providers`, { method: "GET" });
    const itemsRaw = extractItemsArray(body);
    return itemsRaw.map((item) => {
      if (typeof item === "string") return item;
      const o = asRecord(item);
      if (o) {
        return pickString(o, ["name", "providerName", "provider_name", "id", "slug"]);
      }
      return "";
    }).filter(Boolean);
  } catch (e) {
    console.error(`Failed to fetch providers for product ${productSlug}:`, e);
    return [];
  }
}

export type ProductDetailResult = {
  productName: string;
  productCategory: string;
  dateCreated: string;
  phoneNumber: string;
  commissionType: string;
  commissionRate: string;
  cap: string;
  status: boolean;
};

/** `GET /admin/products/{productSlug}` — Get product details including supported providers */
export async function getAdminProductDetails(productSlug: string): Promise<ProductDetailResult> {
  const body = await adminRequest<unknown>(`/admin/products/${encodeURIComponent(productSlug)}`, { method: "GET" });
  const o = asRecord(body) ? (asRecord((body as Record<string, unknown>).data) ?? asRecord(body) ?? {}) : {};

  const name = pickString(o, ["name", "productName", "product_name", "title"]) || productSlug;
  const categorySlug = pickString(o, ["categorySlug", "category_slug", "category", "productCategory"]);
  const category = categorySlug ? humanizeCategorySlug(categorySlug) : "—";
  const dateCreatedRaw = pickString(o, ["dateCreated", "date_created", "createdAt", "created_at"]);
  const dateCreated = dateCreatedRaw ? formatDisplayDate(dateCreatedRaw) : "—";
  const phoneNumber = pickString(o, ["phoneNumber", "phone_number", "phone"]) || "—";

  const chargeTypeRaw = pickString(o, ["chargeType", "charge_type", "commissionType"]) || "none";
  const chargeValue = pickNum(o, ["chargeValue", "charge_value", "commissionRate", "rate"]);
  const chargeCap = pickNum(o, ["chargeCap", "charge_cap", "cap"]);
  const { commissionRate, cap } = formatChargeDisplay(chargeTypeRaw, chargeValue, chargeCap);

  const statusRaw = pickString(o, ["status", "productStatus", "isActive"]);
  const active = statusRaw.toLowerCase() === "active" || o.isActive === true || o.active === true;

  return {
    productName: name,
    productCategory: category,
    dateCreated,
    phoneNumber,
    commissionType: mapChargeType(chargeTypeRaw),
    commissionRate,
    cap,
    status: active,
  };
}
