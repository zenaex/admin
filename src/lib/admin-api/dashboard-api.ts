import { adminRequest } from "@/lib/admin-api/client";
import { formatKoboAmountDisplay } from "@/lib/admin-api/money";

export type NormalizedDashboardKpis = {
  totalTransactionVolume: string;
  totalTransactionVolumeChange: string;
  transactionCount: string;
  transactionCountTrend: string;
  transactionCountTrendVariant: "up" | "down";
  activeUsers: string;
  activeUsersTrend: string;
  activeUsersTrendVariant: "up" | "down";
  newSignups: string;
  newSignupsTrend: string;
  newSignupsTrendVariant: "up" | "down";
};

export type NormalizedTrendItem = {
  month: string;
  inflows: number;
  outflows: number;
};

export type NormalizedProductCategory = {
  name: string;
  value: number;
  color: string;
};

export type NormalizedCryptoVolume = {
  coin: string;
  value: number;
};

export type NormalizedTopCustomer = {
  name: string;
  handle: string;
  initials: string;
};

export type NormalizedPaymentItem = {
  label: string;
  amount: string;
  trend: "up" | "down";
};

export type NormalizedTableItem = {
  name: string;
  quantity: number;
};

export type NormalizedDashboardExtras = {
  productCategories: NormalizedProductCategory[] | null;
  cryptoVolumes: NormalizedCryptoVolume[] | null;
  topCustomers: NormalizedTopCustomer[] | null;
  paymentProcessed: NormalizedPaymentItem[] | null;
  topGiftcards: NormalizedTableItem[] | null;
  topUtility: NormalizedTableItem[] | null;
};

const CATEGORY_COLORS: Record<string, string> = {
  crypto: "#BCEB0F",
  giftcard: "#FF6A6C",
  gift_card: "#FF6A6C",
  "gift-card": "#FF6A6C",
  utility: "#6A82FF",
  vas: "#6A82FF",
  others: "#013220",
  other: "#013220",
  esim: "#F5A623",
  "e-sim": "#F5A623",
  "e-trade": "#A020F0",
  etrade: "#A020F0",
};

function colorForCategory(name: string): string {
  return CATEGORY_COLORS[name.toLowerCase()] ?? "#888888";
}

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

function pickArray(o: Record<string, unknown>, keys: string[]): unknown[] | null {
  for (const k of keys) {
    if (Array.isArray(o[k])) return o[k] as unknown[];
  }
  return null;
}

export function normalizeDashboardKpis(data: unknown): NormalizedDashboardKpis {
  const o = asRecord(data) ?? {};

  const rawVolume = pickNum(o, [
    "totalTransactionVolume",
    "totalTransactionAmount",
    "totalVolume",
    "totalAmount",
    "volume",
    "amount",
  ]);
  const formattedVolume = rawVolume !== undefined
    ? formatKoboAmountDisplay(rawVolume, "NGN")
    : pickString(o, ["formattedVolume", "totalTransactionVolumeFormatted"]) || "₦0.00";

  const volumeChange = pickString(o, [
    "totalTransactionVolumeChange",
    "volumeChange",
    "surgeAmount",
    "volumeSurge",
  ]) || "0";

  const rawCount = pickNum(o, ["transactionCount", "totalTransactions", "count"]) ?? 0;
  const countTrendVal = pickNum(o, ["transactionCountTrend", "transactionCountChange", "countTrend"]) ?? 0;
  const countTrend = `${Math.abs(countTrendVal)}%`;
  const countVariant = countTrendVal >= 0 ? "up" : "down";

  const rawActive = pickNum(o, ["activeUsers", "totalActiveUsers", "activeCount"]) ?? 0;
  const activeTrendVal = pickNum(o, ["activeUsersTrend", "activeUsersChange", "activeTrend"]) ?? 0;
  const activeTrend = `${Math.abs(activeTrendVal)}%`;
  const activeVariant = activeTrendVal >= 0 ? "up" : "down";

  const rawSignups = pickNum(o, ["newSignups", "totalNewSignups", "signupCount", "newUsers"]) ?? 0;
  const signupTrendVal = pickNum(o, ["newSignupsTrend", "newSignupsChange", "signupTrend"]) ?? 0;
  const signupTrend = `${Math.abs(signupTrendVal)}%`;
  const signupVariant = signupTrendVal >= 0 ? "up" : "down";

  return {
    totalTransactionVolume: formattedVolume,
    totalTransactionVolumeChange: volumeChange,
    transactionCount: rawCount.toLocaleString(),
    transactionCountTrend: countTrend,
    transactionCountTrendVariant: countVariant,
    activeUsers: rawActive.toLocaleString(),
    activeUsersTrend: activeTrend,
    activeUsersTrendVariant: activeVariant,
    newSignups: rawSignups.toLocaleString(),
    newSignupsTrend: signupTrend,
    newSignupsTrendVariant: signupVariant,
  };
}

export function normalizeDashboardExtras(data: unknown): NormalizedDashboardExtras {
  const o = asRecord(data) ?? {};

  /* ── Product category breakdown ── */
  const catRaw = pickArray(o, ["productBreakdown", "categoryBreakdown", "categories", "productCategories"]);
  const productCategories: NormalizedProductCategory[] | null = catRaw
    ? catRaw.flatMap((item) => {
        const r = asRecord(item);
        if (!r) return [];
        const name = pickString(r, ["name", "category", "slug", "type", "label"]);
        const value = pickNum(r, ["percentage", "percent", "value", "count", "share"]) ?? 0;
        if (!name) return [];
        return [{ name: name.charAt(0).toUpperCase() + name.slice(1), value: Math.round(value), color: colorForCategory(name) }];
      })
    : null;

  /* ── Crypto exchange volumes ── */
  const cryptoRaw = pickArray(o, ["cryptoVolumes", "cryptoBreakdown", "cryptoExchange", "crypto"]);
  const cryptoVolumes: NormalizedCryptoVolume[] | null = cryptoRaw
    ? cryptoRaw.flatMap((item) => {
        const r = asRecord(item);
        if (!r) return [];
        const coin = pickString(r, ["coin", "symbol", "currency", "name"]).toUpperCase();
        const value = pickNum(r, ["value", "volume", "amount", "total"]) ?? 0;
        if (!coin) return [];
        return [{ coin, value }];
      })
    : null;

  /* ── Top customers ── */
  const custRaw = pickArray(o, ["topCustomers", "top_customers", "leaderboard"]);
  const topCustomers: NormalizedTopCustomer[] | null = custRaw
    ? custRaw.flatMap((item) => {
        const r = asRecord(item);
        if (!r) return [];
        const firstName = pickString(r, ["firstName", "first_name"]);
        const lastName = pickString(r, ["lastName", "last_name"]);
        const fullName = pickString(r, ["name", "fullName", "full_name"]) || `${firstName} ${lastName}`.trim();
        const handle = pickString(r, ["handle", "username", "email", "tag"]) || `@${fullName.split(" ")[0]?.toLowerCase() ?? "user"}`;
        if (!fullName) return [];
        const initials = fullName.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
        return [{ name: fullName, handle, initials }];
      })
    : null;

  /* ── Payment processed breakdown ── */
  const payRaw = pickArray(o, ["paymentProcessed", "paymentBreakdown", "payments"]);
  const paymentProcessed: NormalizedPaymentItem[] | null = payRaw
    ? payRaw.flatMap((item) => {
        const r = asRecord(item);
        if (!r) return [];
        const label = pickString(r, ["label", "type", "category", "name"]);
        const rawAmt = pickNum(r, ["amount", "value", "total", "volume"]);
        const amount = rawAmt !== undefined ? formatKoboAmountDisplay(rawAmt, "NGN") : pickString(r, ["formattedAmount"]) || "₦0";
        const trendVal = pickNum(r, ["trend", "change", "delta"]) ?? 0;
        const trend: "up" | "down" = trendVal >= 0 ? "up" : "down";
        if (!label) return [];
        return [{ label, amount, trend }];
      })
    : null;

  /* ── Top giftcards & utility ── */
  const gcRaw = pickArray(o, ["topGiftcards", "top_giftcards", "topGiftCards", "giftcards"]);
  const topGiftcards: NormalizedTableItem[] | null = gcRaw
    ? gcRaw.flatMap((item) => {
        const r = asRecord(item);
        if (!r) return [];
        const name = pickString(r, ["name", "label", "product"]);
        const quantity = pickNum(r, ["quantity", "count", "total", "value"]) ?? 0;
        if (!name) return [];
        return [{ name, quantity }];
      })
    : null;

  const utilRaw = pickArray(o, ["topUtility", "top_utility", "topVas", "utility", "vas"]);
  const topUtility: NormalizedTableItem[] | null = utilRaw
    ? utilRaw.flatMap((item) => {
        const r = asRecord(item);
        if (!r) return [];
        const name = pickString(r, ["name", "label", "product"]);
        const quantity = pickNum(r, ["quantity", "count", "total", "value"]) ?? 0;
        if (!name) return [];
        return [{ name, quantity }];
      })
    : null;

  return { productCategories, cryptoVolumes, topCustomers, paymentProcessed, topGiftcards, topUtility };
}

export function normalizeDashboardTrend(data: unknown): NormalizedTrendItem[] {
  if (Array.isArray(data)) {
    return data.map(normalizeTrendItem).filter((x): x is NormalizedTrendItem => x !== null);
  }
  const r = asRecord(data);
  if (!r) return [];
  for (const key of ["trend", "items", "data", "results"]) {
    const val = r[key];
    if (Array.isArray(val)) {
      return val.map(normalizeTrendItem).filter((x): x is NormalizedTrendItem => x !== null);
    }
  }
  return [];
}

function normalizeTrendItem(raw: unknown): NormalizedTrendItem | null {
  const o = asRecord(raw);
  if (!o) return null;
  const month = pickString(o, ["month", "label", "date", "time", "period", "x"]) || "—";
  const inflows = pickNum(o, ["inflows", "inflow", "inflowAmount", "amountIn", "y1"]) ?? 0;
  const outflows = pickNum(o, ["outflows", "outflow", "outflowAmount", "amountOut", "y2"]) ?? 0;
  return { month, inflows, outflows };
}

export async function getAdminDashboardKpis(fromDate?: string, toDate?: string): Promise<{ kpis: NormalizedDashboardKpis; extras: NormalizedDashboardExtras }> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/kpis${queryStr}`, { method: "GET" });
  return {
    kpis: normalizeDashboardKpis(data),
    extras: normalizeDashboardExtras(data),
  };
}

export async function getAdminDashboardTrend(period: string): Promise<NormalizedTrendItem[]> {
  const data = await adminRequest<unknown>(`/admin/dashboard/trend?period=${encodeURIComponent(period)}`, { method: "GET" });
  return normalizeDashboardTrend(data);
}
