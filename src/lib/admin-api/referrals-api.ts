import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminReferralConfigBody,
  AdminReferralDetailResult,
  AdminReferralListQuery,
  AdminReferralListResult,
  AdminReferralListRow,
  AdminReferredUserRow,
  AdminReferralsSummary,
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
    r.data ?? r.items ?? r.results ?? r.referrals ?? r.referrers ?? r.rows ?? r.records ?? r.list;
  if (Array.isArray(inner)) return inner;
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested = dataInner.items ?? dataInner.referrals ?? dataInner.referrers ?? dataInner.results;
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

function formatReward(amount: unknown, currency?: string): string {
  if (typeof amount === "string" && amount.trim()) return amount.trim();
  if (typeof amount === "number" && Number.isFinite(amount)) {
    const cur = currency || "₦";
    return `${cur}${amount.toLocaleString()}`;
  }
  return "—";
}

export function normalizeReferralRow(raw: unknown): AdminReferralListRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const accountId =
    pickString(o, ["accountId", "id", "uuid", "customerId", "userId"]) ||
    (typeof o.account_id === "string" ? o.account_id : "");
  if (!accountId) return null;

  const first = pickString(o, ["firstName", "first_name"]);
  const last = pickString(o, ["lastName", "last_name"]);
  const full = [first, last].filter(Boolean).join(" ").trim();
  const name =
    full ||
    pickString(o, ["name", "fullName", "full_name", "customerName", "displayName"]) ||
    pickString(o, ["email"]) ||
    accountId;

  const referralMade =
    pickNum(o, ["referralMade", "referralsMade", "referralCount", "totalReferrals", "count"]) ?? 0;

  const rewardsRaw = o.totalRewardsEarned ?? o.total_rewards_earned ?? o.rewardsEarned ?? o.rewardTotal;
  const rewardCurrency = pickString(o, ["rewardCurrency", "currency"]);
  const totalRewardsEarned = formatReward(rewardsRaw, rewardCurrency || "₦");

  return {
    accountId,
    name,
    email: pickString(o, ["email", "emailAddress"]) || "—",
    phone: pickString(o, ["phone", "phoneNumber", "mobile"]) || "—",
    referralCode: pickString(o, ["referralCode", "referral_code", "code"]) || "—",
    referralMade,
    totalRewardsEarned,
    raw: o,
  };
}

export function normalizeReferralListResponse(
  data: unknown,
  requestedPage: number,
  requestedPageSize: number,
): AdminReferralListResult {
  const itemsRaw = extractItemsArray(data);
  const items = itemsRaw.map(normalizeReferralRow).filter((x): x is AdminReferralListRow => x !== null);
  const total = extractTotal(data, items.length);
  const { page, pageSize } = extractPageInfo(data, requestedPage, requestedPageSize);
  return { items, total, page, pageSize };
}

export async function getAdminReferralsSummary(query?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AdminReferralsSummary> {
  const qs = buildQuery({ fromDate: query?.fromDate, toDate: query?.toDate });
  return adminRequest<AdminReferralsSummary>(`/admin/referrals/summary${qs}`, { method: "GET" });
}

export async function getAdminReferralsList(query?: AdminReferralListQuery): Promise<AdminReferralListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery({
    page,
    pageSize,
    search: query?.search,
    status: query?.status === "" ? undefined : query?.status,
    fromDate: query?.fromDate,
    toDate: query?.toDate,
  });
  const body = await adminRequest<unknown>(`/admin/referrals${qs}`, { method: "GET" });
  return normalizeReferralListResponse(body, page, pageSize);
}

export async function getAdminReferralConfig(): Promise<Record<string, unknown>> {
  const data = await adminRequest<unknown>(`/admin/referrals/config`, { method: "GET" });
  const r = asRecord(data);
  const inner = r ? asRecord(r.data) : null;
  return inner ?? r ?? {};
}

export async function createAdminReferralConfig(body: AdminReferralConfigBody): Promise<unknown> {
  return adminRequest<unknown>(`/admin/referrals/config`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function normalizeReferredRow(raw: unknown, idx: number): AdminReferredUserRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const id =
    pickString(o, ["id", "accountId", "userId", "referredUserId"]) || `referred-${idx}`;
  const first = pickString(o, ["firstName", "first_name"]);
  const last = pickString(o, ["lastName", "last_name"]);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(o, ["name", "fullName", "customerName"]) ||
    "—";

  const statusRaw = pickString(o, ["status", "referralStatus", "state"]) || "—";
  const dateRaw =
    pickString(o, ["createdAt", "created_at", "date", "onboardedAt", "referredAt"]) || "";

  return {
    id,
    name,
    email: pickString(o, ["email"]) || "—",
    phone: pickString(o, ["phone", "phoneNumber"]) || "—",
    referralCode: pickString(o, ["referralCode", "referral_code", "code"]) || "—",
    date: dateRaw ? formatDisplayDate(dateRaw) : "—",
    status: humanizeStatus(statusRaw),
    raw: o,
  };
}

export function normalizeReferralDetailResponse(
  data: unknown,
  accountId: string,
  requestedPage: number,
  requestedPageSize: number,
): AdminReferralDetailResult {
  const r = asRecord(data);
  const root = r ?? {};

  const referrerBlock =
    asRecord(root.referrer) ??
    asRecord(root.customer) ??
    asRecord(root.user) ??
    root;

  const first = pickString(referrerBlock, ["firstName", "first_name"]);
  const last = pickString(referrerBlock, ["lastName", "last_name"]);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(referrerBlock, ["name", "fullName", "customerName"]) ||
    "—";

  const username =
    pickString(referrerBlock, ["username", "userName", "handle"]) ||
    (pickString(referrerBlock, ["email"]).includes("@")
      ? `@${pickString(referrerBlock, ["email"]).split("@")[0]}`
      : "—");

  const statsBlock = asRecord(root.stats) ?? asRecord(root.summary) ?? root;

  let referredRaw: unknown[] = [];
  for (const key of ["referredUsers", "referred", "referrals", "items"]) {
    const val = root[key];
    if (Array.isArray(val) && val.length > 0) {
      referredRaw = val;
      break;
    }
  }
  if (referredRaw.length === 0) referredRaw = extractItemsArray(root);

  const referred = referredRaw
    .map((row, i) => normalizeReferredRow(row, i))
    .filter((x): x is AdminReferredUserRow => x !== null);

  const referredTotal = extractTotal(
    { total: root.referredTotal ?? root.total, items: referredRaw, meta: root.meta },
    referred.length,
  );

  const { page, pageSize } = extractPageInfo(root, requestedPage, requestedPageSize);

  const fmtStat = (v: unknown) => {
    if (v === undefined || v === null) return "—";
    if (typeof v === "number") return v.toLocaleString();
    return String(v);
  };

  return {
    referrer: {
      accountId: pickString(referrerBlock, ["accountId", "id"]) || accountId,
      name,
      username: username.startsWith("@") ? username : username !== "—" ? `@${username}` : "—",
      email: pickString(referrerBlock, ["email"]) || "—",
      phone: pickString(referrerBlock, ["phone", "phoneNumber"]) || "—",
    },
    stats: {
      totalReferralsMade: fmtStat(
        statsBlock.totalReferralsMade ?? statsBlock.referralsMade ?? root.totalReferralsMade,
      ),
      onboardedReferredUsers: fmtStat(
        statsBlock.onboardedReferredUsers ??
          statsBlock.onboardedCount ??
          root.onboardedReferredUsers,
      ),
      pendingReferredUsers: fmtStat(
        statsBlock.pendingReferredUsers ?? statsBlock.pendingCount ?? root.pendingReferredUsers,
      ),
      totalRewardsEarned: formatReward(
        statsBlock.totalRewardsEarned ?? root.totalRewardsEarned,
        pickString(statsBlock, ["rewardCurrency", "currency"]),
      ),
    },
    referred,
    referredTotal,
    page,
    pageSize,
  };
}

export async function getAdminReferralDetail(
  accountId: string,
  query?: { page?: number; pageSize?: number },
): Promise<AdminReferralDetailResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery({ page, pageSize });
  const body = await adminRequest<unknown>(
    `/admin/referrals/${encodeURIComponent(accountId)}${qs}`,
    { method: "GET" },
  );
  return normalizeReferralDetailResponse(body, accountId, page, pageSize);
}

/** Strip currency symbols for API string amounts. */
export function parseAmountString(input: string): string {
  return input.replace(/[^\d.]/g, "").trim() || "0";
}
