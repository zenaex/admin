import { adminRequest } from "@/lib/admin-api/client";
import { formatNgnMajor, koboToMajor, majorToKobo } from "@/lib/admin-api/money";
import type {
  AdminProviderCommissionBody,
  AdminProviderDetail,
  AdminProviderDetailResult,
  AdminProviderEmailBody,
  AdminProviderListQuery,
  AdminProviderListResult,
  AdminProviderListRow,
  AdminProviderProductRow,
  AdminProviderProductToggleBody,
  AdminProviderToggleBody,
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
    "providers",
    "products",
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

  const inner = r.data ?? r.items ?? r.results ?? r.providers ?? r.rows ?? r.records ?? r.list;
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

function humanizeCategorySlug(slug: string): string {
  const t = slug.trim();
  if (!t) return "—";
  return t
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizeProviderStatus(raw: string): "Active" | "Inactive" {
  const s = raw.trim().toLowerCase();
  if (s === "inactive" || s === "disabled" || s === "false" || s === "0") return "Inactive";
  return "Active";
}

function normalizeProviderRow(raw: unknown): AdminProviderListRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id =
    pickString(o, ["id", "providerId", "provider_id", "uuid"]) ||
    (typeof o._id === "string" ? o._id : "");
  if (!id) return null;

  const name =
    pickString(o, ["name", "providerName", "provider_name", "displayName", "title"]) || id;
  const categorySlug = pickString(o, [
    "categorySlug",
    "category_slug",
    "category",
    "type",
    "providerCategory",
    "provider_category",
  ]);
  const category = categorySlug ? humanizeCategorySlug(categorySlug) : "—";

  const dateAddedRaw = pickString(o, [
    "dateAdded",
    "date_added",
    "createdAt",
    "created_at",
    "onboardedAt",
    "onboarded_at",
  ]);
  const lastUpdatedRaw = pickString(o, [
    "lastUpdated",
    "last_updated",
    "updatedAt",
    "updated_at",
    "modifiedAt",
    "modified_at",
  ]);

  const productCount =
    pickNum(o, [
      "noOfProducts",
      "no_of_products",
      "productCount",
      "product_count",
      "productsCount",
      "numberOfProducts",
    ]) ?? 0;

  const statusRaw = pickString(o, ["status", "providerStatus", "provider_status", "isActive"]);
  const status = statusRaw
    ? normalizeProviderStatus(statusRaw)
    : o.isActive === false || o.active === false
      ? "Inactive"
      : "Active";

  return {
    id,
    name,
    category,
    dateAdded: dateAddedRaw ? formatDisplayDate(dateAddedRaw) : "—",
    lastUpdated: lastUpdatedRaw ? formatDisplayDate(lastUpdatedRaw) : "—",
    noOfProducts: productCount,
    status,
  };
}

export function normalizeProviderListResponse(
  data: unknown,
  requestedPage: number,
  requestedPageSize: number,
): AdminProviderListResult {
  const itemsRaw = extractItemsArray(data);
  const items = itemsRaw
    .map(normalizeProviderRow)
    .filter((x): x is AdminProviderListRow => x !== null);
  const total = extractTotal(data, items.length);
  const { page, pageSize } = extractPageInfo(data, requestedPage, requestedPageSize);
  return { items, total, page, pageSize };
}

export type AdminProvidersSummary = {
  totalProviders?: number;
  activeProviders?: number;
  inactiveProviders?: number;
};

function extractProvidersSummary(data: unknown): AdminProvidersSummary {
  const r = asRecord(data);
  if (!r) return {};
  const inner = asRecord(r.data) ?? r;
  const summary = asRecord(inner.summary) ?? asRecord(inner.stats) ?? asRecord(inner.metrics) ?? inner;
  return {
    totalProviders:
      pickNum(r, ["total", "totalProviders", "total_providers", "totalCount", "count"]) ??
      pickNum(summary, ["total", "totalProviders", "total_providers", "totalCount", "count"]),
    activeProviders:
      pickNum(r, ["totalActive", "total_active", "activeProviders", "active_providers", "activeCount"]) ??
      pickNum(summary, ["totalActive", "activeProviders", "active_providers", "activeCount"]),
    inactiveProviders:
      pickNum(r, ["totalInactive", "total_inactive", "inactiveProviders", "inactive_providers", "inactiveCount"]) ??
      pickNum(summary, ["totalInactive", "inactiveProviders", "inactive_providers", "inactiveCount"]),
  };
}

export async function getAdminProvidersList(
  query: AdminProviderListQuery,
): Promise<AdminProviderListResult & { summary: AdminProvidersSummary }> {
  const page = query.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const statusParam =
    query.status === "Active"
      ? "active"
      : query.status === "Inactive"
        ? "inactive"
        : query.status?.trim().toLowerCase();
  const qs = buildQuery({
    page,
    pageSize,
    search: query.search,
    status: statusParam,
    category: query.category,
  });
  const body = await adminRequest<unknown>(`/admin/providers${qs}`, { method: "GET" });
  const list = normalizeProviderListResponse(body, page, pageSize);
  const summary = extractProvidersSummary(body);
  return { ...list, summary };
}

type UiCommissionType = AdminProviderProductRow["commissionType"];

function mapChargeType(apiType: string): UiCommissionType {
  const t = apiType.trim().toLowerCase();
  if (t === "percentage_with_cap" || t === "percentage-with-cap") return "% capped @";
  if (t === "percentage") return "Percentage";
  if (t === "flat") return "Flat";
  return "None";
}

function formatMinorUnits(value: number): string {
  return formatNgnMajor(koboToMajor(value));
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
    const cap =
      chargeCap !== undefined && chargeCap > 0 ? formatMinorUnits(chargeCap) : chargeCap === 0 ? "—" : "—";
    return { commissionRate: rate, cap };
  }
  if (t === "flat") {
    const rate = chargeValue !== undefined ? formatMinorUnits(chargeValue) : "—";
    return { commissionRate: rate, cap: "—" };
  }
  if (chargeValue !== undefined) return { commissionRate: String(chargeValue), cap: "—" };
  return { commissionRate: "—", cap: "—" };
}

function normalizeProviderProductRow(raw: unknown, index: number): AdminProviderProductRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const slug =
    pickString(o, ["slug", "productSlug", "product_slug", "id"]) || `product-${index}`;
  const productName = pickString(o, ["name", "productName", "product_name", "title"]) || slug;
  const categorySlug = pickString(o, ["categorySlug", "category_slug", "category", "productCategory"]);
  const productCategory = categorySlug ? humanizeCategorySlug(categorySlug) : "—";
  const chargeTypeRaw = pickString(o, ["chargeType", "charge_type", "commissionType"]) || "none";
  const chargeValue = pickNum(o, ["chargeValue", "charge_value", "commissionRate", "rate"]);
  const chargeCap = pickNum(o, ["chargeCap", "charge_cap", "cap"]);
  const uiType = mapChargeType(chargeTypeRaw);
  const { commissionRate, cap } = formatChargeDisplay(chargeTypeRaw, chargeValue, chargeCap);
  const isActive = o.isActive !== false && o.active !== false;

  return {
    id: slug,
    slug,
    productName,
    productCategory,
    commissionType: uiType,
    commissionRate,
    cap,
    status: isActive,
    chargeTypeApi: chargeTypeRaw.trim().toLowerCase() || "none",
    chargeValue,
    chargeCap,
  };
}

function providerPath(providerId: string): string {
  return `/admin/providers/${encodeURIComponent(providerId.trim())}`;
}

/** `PATCH /admin/providers/{providerId}` — update provider email. */
export async function patchAdminProviderEmail(
  providerId: string,
  body: AdminProviderEmailBody,
): Promise<void> {
  const email = body.email.trim();
  if (!email) throw new Error("Email is required");
  await adminRequest<unknown>(providerPath(providerId), {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ email }),
  });
}

/** `PATCH /admin/providers/{providerId}/toggle` — activate / deactivate provider. */
export async function patchAdminProviderToggle(
  providerId: string,
  isActive: boolean,
): Promise<void> {
  await adminRequest<unknown>(`${providerPath(providerId)}/toggle`, {
    method: "PATCH",
    auth: true,
    body: JSON.stringify({ isActive } satisfies AdminProviderToggleBody),
  });
}

/** `PATCH /admin/providers/{providerId}/products/{productSlug}/toggle`. */
export async function patchAdminProviderProductToggle(
  providerId: string,
  productSlug: string,
  isActive: boolean,
): Promise<void> {
  await adminRequest<unknown>(
    `${providerPath(providerId)}/products/${encodeURIComponent(productSlug.trim())}/toggle`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ isActive } satisfies AdminProviderProductToggleBody),
    },
  );
}

export function uiCommissionLabelToApi(
  label: AdminProviderProductRow["commissionType"] | string,
): AdminProviderCommissionBody["chargeType"] {
  const t = String(label).trim();
  if (t === "Flat") return "flat";
  if (t === "Percentage") return "percentage";
  if (t === "% capped @") return "percentage_with_cap";
  return "none";
}

function parseMoneyToMinorUnits(input: string): number {
  const n = Number(input.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return majorToKobo(n);
}

function parsePercentNumber(input: string): number {
  const n = Number(input.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Build commission PATCH body from edit form (amounts in major units / percent). */
export function commissionFormToApiBody(form: {
  commissionType: string;
  commissionRate: string;
  cap: string;
}): AdminProviderCommissionBody {
  const chargeType = uiCommissionLabelToApi(form.commissionType);
  if (chargeType === "flat") {
    return {
      chargeType,
      chargeValue: parseMoneyToMinorUnits(form.commissionRate),
      chargeCap: 0,
    };
  }
  if (chargeType === "percentage") {
    return {
      chargeType,
      chargeValue: parsePercentNumber(form.commissionRate),
      chargeCap: 0,
    };
  }
  if (chargeType === "percentage_with_cap") {
    return {
      chargeType,
      chargeValue: parsePercentNumber(form.commissionRate),
      chargeCap: parseMoneyToMinorUnits(form.cap),
    };
  }
  return { chargeType: "none", chargeValue: 0, chargeCap: 0 };
}

/** `PATCH /admin/providers/{providerId}/products/{productSlug}/commission`. */
export async function patchAdminProviderProductCommission(
  providerId: string,
  productSlug: string,
  body: AdminProviderCommissionBody,
): Promise<void> {
  await adminRequest<unknown>(
    `${providerPath(providerId)}/products/${encodeURIComponent(productSlug.trim())}/commission`,
    {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({
        chargeType: body.chargeType,
        chargeValue: body.chargeValue,
        chargeCap: body.chargeCap ?? 0,
      }),
    },
  );
}

/** Prefill commission edit inputs from API minor-unit values. */
export function commissionApiToFormValues(product: AdminProviderProductRow): {
  commissionType: AdminProviderProductRow["commissionType"];
  commissionRate: string;
  cap: string;
} {
  const t = product.chargeTypeApi;
  if (t === "flat" && product.chargeValue !== undefined) {
    return {
      commissionType: "Flat",
      commissionRate: String(product.chargeValue / 100),
      cap: "",
    };
  }
  if (t === "percentage" && product.chargeValue !== undefined) {
    return {
      commissionType: "Percentage",
      commissionRate: String(product.chargeValue),
      cap: "",
    };
  }
  if (t === "percentage_with_cap") {
    return {
      commissionType: "% capped @",
      commissionRate:
        product.chargeValue !== undefined ? String(product.chargeValue) : product.commissionRate,
      cap:
        product.chargeCap !== undefined && product.chargeCap > 0
          ? String(product.chargeCap / 100)
          : product.cap === "—"
            ? ""
            : product.cap.replace(/[^\d.]/g, ""),
    };
  }
  return {
    commissionType: product.commissionType,
    commissionRate: product.commissionRate === "—" ? "" : product.commissionRate,
    cap: product.cap === "—" ? "" : product.cap,
  };
}

function normalizeProviderDetail(raw: Record<string, unknown>, fallbackId: string): AdminProviderDetail {
  const id =
    pickString(raw, ["id", "providerId", "provider_id", "uuid"]) || fallbackId;
  const providerName =
    pickString(raw, ["providerName", "provider_name", "name", "displayName", "title"]) || id;
  const providerId = pickString(raw, ["slug", "providerId", "provider_id", "code", "externalId"]) || id;
  const email = pickString(raw, ["email", "emailAddress", "contactEmail"]) || "—";
  const categorySlug = pickString(raw, [
    "categorySlug",
    "category_slug",
    "category",
    "type",
    "providerCategory",
  ]);
  const category = categorySlug ? humanizeCategorySlug(categorySlug) : "—";
  const dateOnboardedRaw = pickString(raw, [
    "dateOnboarded",
    "date_onboarded",
    "dateAdded",
    "createdAt",
    "created_at",
    "onboardedAt",
  ]);
  const lastUpdatedRaw = pickString(raw, [
    "lastUpdated",
    "last_updated",
    "updatedAt",
    "updated_at",
  ]);
  const statusRaw = pickString(raw, ["status", "providerStatus", "isActive"]);
  const status = statusRaw
    ? normalizeProviderStatus(statusRaw)
    : raw.isActive === false || raw.active === false
      ? "Inactive"
      : "Active";

  return {
    id,
    providerId,
    providerName,
    email,
    category,
    dateOnboarded: dateOnboardedRaw ? formatDisplayDate(dateOnboardedRaw) : "—",
    lastUpdated: lastUpdatedRaw ? formatDisplayDate(lastUpdatedRaw) : "—",
    status,
  };
}

export function normalizeProviderDetailResult(
  data: unknown,
  fallbackProviderId: string,
): AdminProviderDetailResult {
  const r = asRecord(data);
  const providerRaw =
    (r ? asRecord(r.provider) : null) ??
    (r ? asRecord(r.data) : null) ??
    r ??
    {};
  const provider = normalizeProviderDetail(providerRaw, fallbackProviderId);

  const productsRaw = r && Array.isArray(r.products) ? r.products : extractItemsArray(data);
  const products = productsRaw
    .map((raw, idx) => normalizeProviderProductRow(raw, idx))
    .filter((x): x is AdminProviderProductRow => x !== null);

  const totalProducts =
    (r ? pickNum(r, ["totalProducts", "total_products", "productCount"]) : undefined) ??
    products.length;

  return { provider, products, totalProducts };
}

export async function getAdminProviderDetail(providerId: string): Promise<AdminProviderDetailResult> {
  const body = await adminRequest<unknown>(
    `/admin/providers/${encodeURIComponent(providerId)}`,
    { method: "GET" },
  );
  return normalizeProviderDetailResult(body, providerId);
}
