import { adminRequest, AdminApiError } from "@/lib/admin-api/client";
import {
  formatKoboAmountDisplay,
  koboToMajor,
  parseMajorAmountInputAsKobo,
  pickKobo,
} from "@/lib/admin-api/money";
import type {
  AdminReferralConfigBody,
  AdminReferralConfigForm,
  AdminReferralConfigUpdateBody,
  AdminReferralDetailResult,
  AdminReferralListQuery,
  AdminReferralListResult,
  AdminReferralListRow,
  AdminReferredUserRow,
  AdminReferralsSummary,
  ReferralThresholdType,
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
  const t = s.replace(/_/g, " ").trim().toLowerCase();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

const REWARD_AMOUNT_KEYS = [
  "totalRewardEarned",
  "total_reward_earned",
  "totalRewardsEarned",
  "total_rewards_earned",
  "rewardsEarned",
  "rewards_earned",
  "rewardTotal",
  "reward_total",
  "totalRewards",
  "total_rewards",
  "earnedRewards",
  "earned_rewards",
  "totalEarned",
  "total_earned",
  "rewardsEarnedKobo",
  "totalRewardsEarnedKobo",
];

const REFERRAL_COUNT_KEYS = [
  "totalReferrals",
  "total_referrals",
  "referralMade",
  "referralsMade",
  "referralCount",
  "referral_count",
  "totalReferralsMade",
  "total_referrals_made",
  "referralsCount",
  "count",
];

const ONBOARDED_COUNT_KEYS = [
  "onboardedUsers",
  "onboarded_users",
  "onboardedReferredUsers",
  "onboarded_referred_users",
  "onboardedCount",
  "onboarded_count",
];

const PENDING_COUNT_KEYS = [
  "pendingUsers",
  "pending_users",
  "pendingReferredUsers",
  "pending_referred_users",
  "pendingCount",
  "pending_count",
  "pendingReferrals",
  "pending_referrals",
];

const REWARD_CURRENCY_KEYS = ["rewardCurrency", "reward_currency", "currency", "currencyCode"];

function referralRowBlocks(o: Record<string, unknown>): Record<string, unknown>[] {
  const nested =
    asRecord(o.referrer) ??
    asRecord(o.customer) ??
    asRecord(o.user) ??
    asRecord(o.account);
  const stats = asRecord(o.stats);
  const summary = asRecord(o.summary);
  const rewards = asRecord(o.rewards);
  const metrics = asRecord(o.metrics);
  return [o, nested, stats, summary, rewards, metrics].filter((b): b is Record<string, unknown> =>
    Boolean(b),
  );
}

function pickFromBlocks(
  blocks: Record<string, unknown>[],
  keys: string[],
): string {
  for (const block of blocks) {
    const s = pickString(block, keys);
    if (s) return s;
  }
  return "";
}

function pickNumFromBlocks(
  blocks: Record<string, unknown>[],
  keys: string[],
): number | undefined {
  for (const block of blocks) {
    const n = pickNum(block, keys);
    if (n !== undefined) return n;
    const kobo = pickKobo(block, keys);
    if (kobo !== undefined) return kobo;
  }
  return undefined;
}

function pickKoboFromBlocks(
  blocks: Record<string, unknown>[],
  keys: string[],
): number | undefined {
  for (const block of blocks) {
    const kobo = pickKobo(block, keys);
    if (kobo !== undefined) return kobo;
    const n = pickNum(block, keys);
    if (n !== undefined) return n;
  }
  return undefined;
}

function formatReward(amount: unknown, currency?: string): string {
  const cur = (currency || "NGN").trim() || "NGN";
  if (amount === undefined || amount === null) {
    return formatKoboAmountDisplay(0, cur);
  }
  if (typeof amount === "string") {
    const t = amount.trim();
    if (!t || t === "—") return formatKoboAmountDisplay(0, cur);
    if (/^[₦$]/.test(t)) return t;
    const curMatch = t.match(/\b([A-Z]{3})\b/);
    const resolvedCur = curMatch?.[1] ?? cur;
    const n = Number(t.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n) && t.replace(/[^\d.-]/g, "") !== "") {
      return formatKoboAmountDisplay(n, resolvedCur);
    }
    return t;
  }
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return formatKoboAmountDisplay(amount, cur);
  }
  return formatKoboAmountDisplay(0, cur);
}

function formatRewardsFromBlocks(blocks: Record<string, unknown>[]): string {
  const kobo = pickKoboFromBlocks(blocks, REWARD_AMOUNT_KEYS);
  const currency = pickFromBlocks(blocks, REWARD_CURRENCY_KEYS) || "NGN";
  if (kobo !== undefined) return formatKoboAmountDisplay(kobo, currency);
  const rewardsFallback =
    pickNumFromBlocks(blocks, REWARD_AMOUNT_KEYS) ??
    pickFromBlocks(blocks, REWARD_AMOUNT_KEYS);
  return formatReward(rewardsFallback || undefined, currency);
}

function koboAmountToFormString(value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(koboToMajor(value));
  }
  const t = String(value).replace(/[^\d.]/g, "");
  if (!t) return fallback;
  const n = Number(t);
  if (!Number.isFinite(n)) return fallback;
  return String(koboToMajor(n));
}

function formatStatCount(v: unknown): string {
  if (v === undefined || v === null) return "0";
  if (typeof v === "number" && Number.isFinite(v)) return v.toLocaleString();
  const s = String(v).trim();
  if (!s || s === "—") return "0";
  const n = Number(s.replace(/[^\d.-]/g, ""));
  if (Number.isFinite(n) && s.replace(/[^\d.-]/g, "") !== "") return n.toLocaleString();
  return s;
}

export function normalizeReferralRow(raw: unknown): AdminReferralListRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const blocks = referralRowBlocks(o);

  const accountId =
    pickFromBlocks(blocks, ["accountId", "id", "uuid", "customerId", "userId"]) ||
    (typeof o.account_id === "string" ? o.account_id : "");
  if (!accountId) return null;

  const first = pickFromBlocks(blocks, ["firstName", "first_name"]);
  const last = pickFromBlocks(blocks, ["lastName", "last_name"]);
  const full = [first, last].filter(Boolean).join(" ").trim();
  const name =
    full ||
    pickFromBlocks(blocks, ["name", "fullName", "full_name", "customerName", "displayName"]) ||
    pickFromBlocks(blocks, ["email"]) ||
    accountId;

  const referralMade = pickNumFromBlocks(blocks, REFERRAL_COUNT_KEYS) ?? 0;

  const totalRewardsEarned = formatRewardsFromBlocks(blocks);

  return {
    accountId,
    name,
    email: pickFromBlocks(blocks, ["email", "emailAddress"]) || "—",
    phone: pickFromBlocks(blocks, ["phone", "phoneNumber", "mobile"]) || "—",
    referralCode: pickFromBlocks(blocks, ["referralCode", "referral_code", "code"]) || "—",
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

export function normalizeReferralsSummary(data: unknown): AdminReferralsSummary {
  const r = asRecord(data) ?? {};
  const inner = asRecord(r.data) ?? r;
  const blocks = [inner, r].filter((b): b is Record<string, unknown> => Boolean(b));

  const totalRewardsEarned = formatRewardsFromBlocks(blocks);

  return {
    totalReferrers:
      pickNumFromBlocks(blocks, ["totalReferrers", "total_referrers", "referrerCount", "count"]) ?? 0,
    totalReferralsMade: pickNumFromBlocks(blocks, REFERRAL_COUNT_KEYS) ?? 0,
    pendingReferrals: pickNumFromBlocks(blocks, PENDING_COUNT_KEYS) ?? 0,
    totalRewardsEarned,
  };
}

export async function getAdminReferralsSummary(query?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AdminReferralsSummary> {
  const qs = buildQuery({ fromDate: query?.fromDate, toDate: query?.toDate });
  const body = await adminRequest<unknown>(`/admin/referrals/summary${qs}`, { method: "GET" });
  return normalizeReferralsSummary(body);
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

const DEFAULT_REFERRAL_CONFIG_FORM: AdminReferralConfigForm = {
  minTransactionAmount: "100",
  currency: "NGN",
  maxDaysFromOnboarding: 30,
  cycleSize: 10,
  allowedProducts: [],
  rewardAmount: "50",
  rewardCurrency: "NGN",
  thresholdType: "transaction_count",
};

function normalizeThresholdType(raw: unknown): ReferralThresholdType {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (s === "amount_spent" || s === "amountspent") return "amount_spent";
  if (s === "signup_count" || s === "signupcount" || s === "sign_up_count") return "signup_count";
  return "transaction_count";
}

function pickStringArray(o: Record<string, unknown>, keys: string[]): string[] {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) {
      return v.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof v === "string" && v.trim()) {
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/** Map `GET /admin/referrals/config` payload into form state. */
export function normalizeReferralConfig(data: unknown): AdminReferralConfigForm {
  const r = asRecord(data);
  const root = r ? (asRecord(r.data) ?? asRecord(r.config) ?? r) : {};
  const minTx = root.minTransactionAmount ?? root.min_transaction_amount;
  const reward = root.rewardAmount ?? root.reward_amount;
  return {
    minTransactionAmount: koboAmountToFormString(minTx, "100"),
    currency: pickString(root, ["currency", "minTransactionCurrency"]) || "NGN",
    maxDaysFromOnboarding:
      pickNum(root, ["maxDaysFromOnboarding", "max_days_from_onboarding"]) ?? 30,
    cycleSize: pickNum(root, ["cycleSize", "cycle_size"]) ?? 10,
    allowedProducts: pickStringArray(root, ["allowedProducts", "allowed_products"]),
    rewardAmount: koboAmountToFormString(reward, "50"),
    rewardCurrency: pickString(root, ["rewardCurrency", "reward_currency"]) || "NGN",
    thresholdType: normalizeThresholdType(root.thresholdType ?? root.threshold_type),
  };
}

export type AdminReferralConfigLoadResult = {
  exists: boolean;
  form: AdminReferralConfigForm;
};

/** Active referral configuration; `exists` is false when API returns 404. */
export async function getAdminReferralConfig(): Promise<AdminReferralConfigLoadResult> {
  try {
    const data = await adminRequest<unknown>(`/admin/referrals/config`, {
      method: "GET",
      auth: true,
    });
    return { exists: true, form: normalizeReferralConfig(data) };
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 404) {
      return { exists: false, form: { ...DEFAULT_REFERRAL_CONFIG_FORM } };
    }
    throw e;
  }
}

export function referralConfigFormToPostBody(form: AdminReferralConfigForm): AdminReferralConfigBody {
  return {
    minTransactionAmount: String(parseMajorAmountInputAsKobo(form.minTransactionAmount)),
    currency: form.currency.trim() || "NGN",
    maxDaysFromOnboarding: form.maxDaysFromOnboarding,
    cycleSize: form.cycleSize,
    allowedProducts: form.allowedProducts,
    rewardAmount: String(parseMajorAmountInputAsKobo(form.rewardAmount)),
    rewardCurrency: form.rewardCurrency.trim() || "NGN",
    thresholdType: form.thresholdType,
  };
}

export function referralConfigFormToPutBody(form: AdminReferralConfigForm): AdminReferralConfigUpdateBody {
  return {
    minTransactionAmount: parseMajorAmountInputAsKobo(form.minTransactionAmount),
    currency: form.currency.trim() || "NGN",
    maxDaysFromOnboarding: form.maxDaysFromOnboarding,
    cycleSize: form.cycleSize,
    allowedProducts: form.allowedProducts,
    rewardAmount: parseMajorAmountInputAsKobo(form.rewardAmount),
    rewardCurrency: form.rewardCurrency.trim() || "NGN",
    thresholdType: form.thresholdType,
  };
}

export async function createAdminReferralConfig(body: AdminReferralConfigBody): Promise<unknown> {
  return adminRequest<unknown>(`/admin/referrals/config`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

/** `PUT /admin/referrals/config` — update active configuration (super_admin). */
export async function updateAdminReferralConfig(body: AdminReferralConfigUpdateBody): Promise<unknown> {
  return adminRequest<unknown>(`/admin/referrals/config`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(body),
  });
}

/** Create on first save; update when config already exists (or after 409). */
export async function saveAdminReferralConfig(
  form: AdminReferralConfigForm,
  options: { exists: boolean },
): Promise<"created" | "updated"> {
  if (options.exists) {
    try {
      await updateAdminReferralConfig(referralConfigFormToPutBody(form));
      return "updated";
    } catch (e) {
      if (e instanceof AdminApiError && e.status === 404) {
        await createAdminReferralConfig(referralConfigFormToPostBody(form));
        return "created";
      }
      throw e;
    }
  }
  try {
    await createAdminReferralConfig(referralConfigFormToPostBody(form));
    return "created";
  } catch (e) {
    if (e instanceof AdminApiError && e.status === 409) {
      await updateAdminReferralConfig(referralConfigFormToPutBody(form));
      return "updated";
    }
    throw e;
  }
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
    pickString(o, [
      "referredAt",
      "referred_at",
      "qualifiedAt",
      "qualified_at",
      "createdAt",
      "created_at",
      "date",
      "onboardedAt",
    ]) || "";

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

  const detailBlocks = referralRowBlocks(root);

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

  return {
    referrer: {
      accountId: pickString(referrerBlock, ["accountId", "id"]) || accountId,
      name,
      username: username.startsWith("@") ? username : username !== "—" ? `@${username}` : "—",
      email: pickString(referrerBlock, ["email"]) || "—",
      phone: pickString(referrerBlock, ["phone", "phoneNumber"]) || "—",
    },
    stats: {
      totalReferralsMade: formatStatCount(pickNumFromBlocks(detailBlocks, REFERRAL_COUNT_KEYS)),
      onboardedReferredUsers: formatStatCount(
        pickNumFromBlocks(detailBlocks, ONBOARDED_COUNT_KEYS),
      ),
      pendingReferredUsers: formatStatCount(pickNumFromBlocks(detailBlocks, PENDING_COUNT_KEYS)),
      totalRewardsEarned: formatRewardsFromBlocks(detailBlocks),
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
