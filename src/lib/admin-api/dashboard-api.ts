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
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm.includes("giftcard") || norm.includes("giftcards")) return CATEGORY_COLORS["giftcard"];
  return CATEGORY_COLORS[name.toLowerCase()] ?? CATEGORY_COLORS[norm] ?? "#888888";
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
    "totalValueKobo",
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

  const rawVolumeChange = pickNum(o, ["totalValueDeltaPct"]) ?? pickString(o, [
    "totalTransactionVolumeChange",
    "volumeChange",
    "surgeAmount",
    "volumeSurge",
  ]);
  const volumeChange = typeof rawVolumeChange === "number"
    ? `${rawVolumeChange}%`
    : (rawVolumeChange || "0");

  const rawCount = pickNum(o, ["txCount", "transactionCount", "totalTransactions", "count"]) ?? 0;
  const countTrendVal = pickNum(o, ["txCountDeltaPct", "transactionCountTrend", "transactionCountChange", "countTrend"]) ?? 0;
  const countTrend = `${Math.abs(countTrendVal)}%`;
  const countVariant = countTrendVal >= 0 ? "up" : "down";

  const rawActive = pickNum(o, ["activeUsers", "totalActiveUsers", "activeCount"]) ?? 0;
  const activeTrendVal = pickNum(o, ["activeUsersDeltaPct", "activeUsersTrend", "activeUsersChange", "activeTrend"]) ?? 0;
  const activeTrend = `${Math.abs(activeTrendVal)}%`;
  const activeVariant = activeTrendVal >= 0 ? "up" : "down";

  const rawSignups = pickNum(o, ["newSignups", "totalNewSignups", "signupCount", "newUsers"]) ?? 0;
  const signupTrendVal = pickNum(o, ["newSignupsDeltaPct", "newSignupsTrend", "newSignupsChange", "signupTrend"]) ?? 0;
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
  for (const key of ["points", "trend", "items", "data", "results"]) {
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

  const rawMonth = pickString(o, ["bucket", "month", "label", "date", "time", "period", "x"]) || "—";
  let month = rawMonth;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ymd = rawMonth.split("-");
  if (ymd.length === 2 && ymd[0].length === 4 && ymd[1].length === 2) {
    const yr = ymd[0].slice(-2);
    const moIdx = parseInt(ymd[1], 10) - 1;
    if (moIdx >= 0 && moIdx < 12) {
      month = `${MONTHS[moIdx]} '${yr}`;
    }
  } else if (ymd.length === 3 && ymd[0].length === 4 && ymd[1].length === 2 && ymd[2].length === 2) {
    const moIdx = parseInt(ymd[1], 10) - 1;
    const day = parseInt(ymd[2], 10);
    if (moIdx >= 0 && moIdx < 12) {
      month = `${MONTHS[moIdx]} ${day}`;
    }
  }

  const rawInflow = pickNum(o, ["inflowKobo", "inflows", "inflow", "inflowAmount", "amountIn", "y1"]);
  const rawOutflow = pickNum(o, ["outflowKobo", "outflows", "outflow", "outflowAmount", "amountOut", "y2"]);

  const hasKoboKeys = "inflowKobo" in o || "outflowKobo" in o;

  const inflows = rawInflow !== undefined
    ? (hasKoboKeys ? rawInflow / 100 : rawInflow)
    : 0;
  const outflows = rawOutflow !== undefined
    ? (hasKoboKeys ? rawOutflow / 100 : rawOutflow)
    : 0;

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

export function normalizeDashboardCategories(data: unknown): NormalizedProductCategory[] {
  let items: { name: string; rawValue: number }[] = [];

  const parseItem = (item: unknown) => {
    const r = asRecord(item);
    if (!r) return null;
    const name = pickString(r, ["name", "category", "slug", "type", "label"]);
    const rawVal = pickNum(r, ["valueKobo", "percentage", "percent", "value", "count", "share"]) ?? 0;
    if (!name) return null;
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      rawValue: rawVal,
    };
  };

  if (Array.isArray(data)) {
    items = data.map(parseItem).filter((x): x is { name: string; rawValue: number } => x !== null);
  } else {
    const o = asRecord(data);
    if (o) {
      const catRaw = pickArray(o, ["categories", "productBreakdown", "categoryBreakdown", "productCategories", "data", "items", "results"]);
      if (catRaw) {
        items = catRaw.map(parseItem).filter((x): x is { name: string; rawValue: number } => x !== null);
      }
    }
  }

  if (items.length === 0) return [];

  const totalSum = items.reduce((sum, item) => sum + item.rawValue, 0);

  return items.map((item) => {
    const pct = totalSum > 0 ? (item.rawValue / totalSum) * 100 : 0;
    let roundedValue = Math.round(pct);
    if (pct > 0 && roundedValue === 0) {
      roundedValue = Number(pct.toFixed(1)) || 0.1;
    }
    return {
      name: item.name,
      value: roundedValue,
      color: colorForCategory(item.name),
    };
  });
}

export async function getAdminDashboardCategories(fromDate?: string, toDate?: string): Promise<NormalizedProductCategory[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/categories${queryStr}`, { method: "GET" });
  return normalizeDashboardCategories(data);
}

export function normalizeDashboardPaymentSummary(data: unknown): NormalizedPaymentItem[] {
  const o = asRecord(data);
  if (!o) return [];

  // Check if it's the key-value dictionary shape:
  // { deposit: { valueKobo, deltaPct }, ... }
  const isDictionary = Object.keys(o).some(key => {
    const val = asRecord(o[key]);
    return val && ("valueKobo" in val || "deltaPct" in val || "value" in val);
  });

  if (isDictionary) {
    return Object.entries(o).flatMap(([key, val]) => {
      const r = asRecord(val);
      if (!r) return [];

      let label = key.charAt(0).toUpperCase() + key.slice(1);
      if (label.toLowerCase() === "giftcard" || label.toLowerCase() === "gift_card") {
        label = "Giftcard";
      } else if (label.toLowerCase() === "utility") {
        label = "Utility/ VAS";
      }

      const rawAmt = pickNum(r, ["valueKobo", "amountKobo", "totalKobo", "volumeKobo", "value", "amount", "total", "volume"]);
      const hasKobo = "valueKobo" in r || "amountKobo" in r || "totalKobo" in r || "volumeKobo" in r || key.toLowerCase().includes("kobo");
      const amount = rawAmt !== undefined
        ? formatKoboAmountDisplay(hasKobo ? rawAmt : rawAmt * 100, "NGN")
        : "₦0.00";

      const trendVal = pickNum(r, ["deltaPct", "changePct", "trendPct", "trend", "change", "delta"]) ?? 0;
      const trend: "up" | "down" = trendVal >= 0 ? "up" : "down";

      return [{ label, amount, trend }];
    });
  }

  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    const arr = pickArray(o, ["paymentProcessed", "paymentBreakdown", "payments", "summary", "data", "items", "results"]);
    if (arr) items = arr;
  }

  return items.flatMap((item) => {
    const r = asRecord(item);
    if (!r) return [];
    const label = pickString(r, ["label", "type", "category", "name"]);
    const rawAmt = pickNum(r, ["amount", "value", "total", "volume", "amountKobo", "valueKobo", "totalKobo", "volumeKobo"]);
    const hasKobo = "amountKobo" in r || "valueKobo" in r || "totalKobo" in r || "volumeKobo" in r || label.toLowerCase().includes("kobo");
    const amount = rawAmt !== undefined
      ? formatKoboAmountDisplay(hasKobo ? rawAmt : rawAmt * 100, "NGN")
      : pickString(r, ["formattedAmount"]) || "₦0";
    const trendVal = pickNum(r, ["trend", "change", "delta", "trendPct", "changePct", "deltaPct"]) ?? 0;
    const trend: "up" | "down" = trendVal >= 0 ? "up" : "down";
    if (!label) return [];
    return [{ label, amount, trend }];
  });
}

export async function getAdminDashboardPaymentSummary(fromDate?: string, toDate?: string): Promise<NormalizedPaymentItem[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/payment-summary${queryStr}`, { method: "GET" });
  return normalizeDashboardPaymentSummary(data);
}

export function normalizeDashboardCrypto(data: unknown): NormalizedCryptoVolume[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    const o = asRecord(data);
    if (o) {
      const arr = pickArray(o, ["assets", "cryptoVolumes", "cryptoBreakdown", "cryptoExchange", "crypto", "volumes", "data", "items", "results", "points"]);
      if (arr) items = arr;
    }
  }
  return items.flatMap((item) => {
    const r = asRecord(item);
    if (!r) return [];
    const coin = pickString(r, ["asset", "coin", "symbol", "currency", "name"]).toUpperCase();
    const rawVal = pickNum(r, ["valueKobo", "volumeKobo", "amountKobo", "totalKobo", "value", "volume", "amount", "total"]) ?? 0;
    const hasKobo = "valueKobo" in r || "volumeKobo" in r || "amountKobo" in r || "totalKobo" in r;
    const value = hasKobo ? rawVal / 100 : rawVal;
    if (!coin) return [];
    return [{ coin, value }];
  });
}

export async function getAdminDashboardCrypto(fromDate?: string, toDate?: string): Promise<NormalizedCryptoVolume[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/crypto${queryStr}`, { method: "GET" });
  return normalizeDashboardCrypto(data);
}

export function normalizeDashboardTopCustomers(data: unknown): NormalizedTopCustomer[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    const o = asRecord(data);
    if (o) {
      const arr = pickArray(o, ["topCustomers", "top_customers", "leaderboard", "data", "items", "results"]);
      if (arr) items = arr;
    }
  }
  return items.flatMap((item) => {
    const r = asRecord(item);
    if (!r) return [];
    const firstName = pickString(r, ["firstName", "first_name"]);
    const lastName = pickString(r, ["lastName", "last_name"]);
    const fullName = pickString(r, ["name", "fullName", "full_name"]) || `${firstName} ${lastName}`.trim();
    const handle = pickString(r, ["handle", "username", "email", "tag"]) || `@${fullName.split(" ")[0]?.toLowerCase() ?? "user"}`;
    if (!fullName) return [];
    const initials = fullName.split(" ").map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
    return [{ name: fullName, handle, initials }];
  });
}

export async function getAdminDashboardTopCustomers(fromDate?: string, toDate?: string): Promise<NormalizedTopCustomer[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/top-customers${queryStr}`, { method: "GET" });
  return normalizeDashboardTopCustomers(data);
}

export function normalizeDashboardTopGiftcards(data: unknown): NormalizedTableItem[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    const o = asRecord(data);
    if (o) {
      const arr = pickArray(o, ["topGiftcards", "top_giftcards", "topGiftCards", "giftcards", "data", "items", "results"]);
      if (arr) items = arr;
    }
  }
  return items.flatMap((item) => {
    const r = asRecord(item);
    if (!r) return [];
    const name = pickString(r, ["providerSlug", "name", "label", "product"]);
    const formattedName = name
      ? name.split("-").map(word => {
          const acronyms = ["cvs", "mtn", "dstv", "ikedc", "vtu", "ekedc", "ikedc"];
          if (acronyms.includes(word.toLowerCase())) return word.toUpperCase();
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(" ")
      : "";
    const quantity = pickNum(r, ["quantity", "count", "total", "value"]) ?? 0;
    if (!formattedName) return [];
    return [{ name: formattedName, quantity }];
  });
}

export async function getAdminDashboardTopGiftcards(fromDate?: string, toDate?: string): Promise<NormalizedTableItem[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  params.set("limit", "5");
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/top-giftcards${queryStr}`, { method: "GET" });
  return normalizeDashboardTopGiftcards(data).slice(0, 5);
}

export function normalizeDashboardTopUtility(data: unknown): NormalizedTableItem[] {
  let items: unknown[] = [];
  if (Array.isArray(data)) {
    items = data;
  } else {
    const o = asRecord(data);
    if (o) {
      const arr = pickArray(o, ["topUtility", "top_utility", "topVas", "utility", "vas", "data", "items", "results"]);
      if (arr) items = arr;
    }
  }
  return items.flatMap((item) => {
    const r = asRecord(item);
    if (!r) return [];
    const name = pickString(r, ["productSlug", "name", "label", "product"]);
    const formattedName = name
      ? name.split("-").map(word => {
          const acronyms = ["cvs", "mtn", "dstv", "ikedc", "vtu", "ekedc", "ikedc"];
          if (acronyms.includes(word.toLowerCase())) return word.toUpperCase();
          return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(" ")
      : "";
    const quantity = pickNum(r, ["quantity", "count", "total", "value"]) ?? 0;
    if (!formattedName) return [];
    return [{ name: formattedName, quantity }];
  });
}

export async function getAdminDashboardTopUtility(fromDate?: string, toDate?: string): Promise<NormalizedTableItem[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  params.set("limit", "5");
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const data = await adminRequest<unknown>(`/admin/dashboard/top-utility${queryStr}`, { method: "GET" });
  return normalizeDashboardTopUtility(data).slice(0, 5);
}
