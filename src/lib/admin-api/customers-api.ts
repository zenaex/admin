import { getAdminAuditCustomerLogs as fetchAdminAuditCustomerLogs } from "@/lib/admin-api/audit-api";
import { adminRequest } from "@/lib/admin-api/client";
import { normalizeTransactionListResponse } from "@/lib/admin-api/transactions-api";
import type {
  AdminCustomerListQuery,
  AdminCustomerListResult,
  AdminCustomerListRow,
  AdminCustomersSummary,
  AdminCustomerTransactionListResult,
  AdminCustomerTransactionRow,
  AdminCustomerTransactionSummary,
  AdminCustomerKycDetails,
  AdminCustomerKycTier1,
  AdminCustomerKycTier2,
  AdminCustomerWalletItem,
  AdminCustomerWalletsResponse,
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

export async function getAdminCustomersSummary(query?: { fromDate?: string; toDate?: string }): Promise<AdminCustomersSummary> {
  const qs = buildQuery({ fromDate: query?.fromDate, toDate: query?.toDate });
  return adminRequest<AdminCustomersSummary>(`/admin/customers/summary${qs}`, { method: "GET" });
}

function firstArrayFromRecord(rec: Record<string, unknown>): unknown[] | null {
  for (const key of [
    "items",
    "transactions",
    "walletTransactions",
    "wallet_transactions",
    "customers",
    "users",
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
    r.customers ??
    r.rows ??
    r.records ??
    r.list ??
    r.users;
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
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return isoOrAny;
}

function humanizeStatus(s: string): string {
  if (!s) return "—";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function normalizeCustomerRow(raw: unknown): AdminCustomerListRow | null {
  const o = asRecord(raw);
  if (!o) return null;
  const accountId =
    pickString(o, ["accountId", "id", "uuid", "userId", "customerId"]) ||
    (typeof o.account_id === "string" ? o.account_id : "");
  if (!accountId) return null;

  const first = pickString(o, ["firstName", "first_name", "givenName"]);
  const last = pickString(o, ["lastName", "last_name", "familyName"]);
  const full = [first, last].filter(Boolean).join(" ").trim();
  const name =
    full ||
    pickString(o, ["fullName", "full_name", "name", "displayName", "customerName"]) ||
    pickString(o, ["email"]) ||
    accountId;

  const username =
    pickString(o, ["username", "userName", "handle"]) ||
    (pickString(o, ["email"]).includes("@") ? `@${pickString(o, ["email"]).split("@")[0]}` : "—");

  const email = pickString(o, ["email", "emailAddress"]);
  const phone = pickString(o, ["phone", "phoneNumber", "mobile", "msisdn"]);

  const statusRaw =
    pickString(o, ["accountStatus", "account_status", "status", "userStatus"]) ||
    (typeof o.accountStatus === "string" ? o.accountStatus : "");
  const statusLabel = statusRaw ? humanizeStatus(statusRaw) : "—";

  const dateRaw =
    pickString(o, ["createdAt", "created_at", "dateOnboarded", "onboardedAt", "signupDate"]) ||
    (typeof o.createdAt === "string" ? o.createdAt : "");
  const dateOnboarded = dateRaw ? formatDisplayDate(dateRaw) : "—";

  return {
    accountId,
    name,
    username: username.startsWith("@") ? username : username !== "—" ? `@${username}` : "—",
    email: email || "—",
    phone: phone || "—",
    statusLabel,
    dateOnboarded,
    raw: o,
  };
}

export function normalizeCustomerListResponse(data: unknown, requestedPage: number, requestedPageSize: number): AdminCustomerListResult {
  const itemsRaw = extractItemsArray(data);
  const items = itemsRaw.map(normalizeCustomerRow).filter((x): x is AdminCustomerListRow => x !== null);
  const total = extractTotal(data, items.length);
  const { page, pageSize } = extractPageInfo(data, requestedPage, requestedPageSize);
  return { items, total, page, pageSize };
}

export async function getAdminCustomersList(query: AdminCustomerListQuery): Promise<AdminCustomerListResult> {
  const page = query.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
  const qs = buildQuery({
    page,
    pageSize,
    search: query.search,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
    accountStatus: query.accountStatus === "" ? undefined : query.accountStatus,
    activityStatus: query.activityStatus === "" ? undefined : query.activityStatus,
    kycTier: query.kycTier === 0 ? undefined : query.kycTier,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });
  const body = await adminRequest<unknown>(`/admin/customers${qs}`, { method: "GET" });
  return normalizeCustomerListResponse(body, page, pageSize);
}

/** Full customer profile — shape varies; consumers pick fields defensively. */
export async function getAdminCustomerProfile(accountId: string): Promise<Record<string, unknown>> {
  const data = await adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}`, { method: "GET" });
  const r = asRecord(data);
  if (!r) return {};
  const inner =
    asRecord(r.data) ?? asRecord(r.customer) ?? asRecord(r.profile) ?? asRecord(r.account);
  return inner ?? r;
}

/** Map API password status (boolean or `passwordStatus` string) to Set / Not Set. */
export function passwordStatusToSet(value: unknown): "Set" | "Not Set" {
  if (value === true || value === 1) return "Set";
  if (value === false || value === 0) return "Not Set";
  if (typeof value === "string") {
    const s = value.trim().toLowerCase().replace(/-/g, "_");
    if (!s) return "Not Set";
    if (s === "set" || s === "configured" || s === "enabled" || s === "active" || s === "yes" || s === "true") {
      return "Set";
    }
    if (
      s === "not_set" ||
      s === "notset" ||
      s === "unset" ||
      s === "disabled" ||
      s === "no" ||
      s === "false" ||
      (s.includes("not") && s.includes("set"))
    ) {
      return "Not Set";
    }
    if (s.includes("set")) return "Set";
  }
  return "Not Set";
}

export function pickCustomerPasswordStatus(profile: Record<string, unknown>): "Set" | "Not Set" {
  const raw =
    profile.passwordStatus ??
    profile.password_status ??
    profile.passwordSet ??
    profile.password_set ??
    profile.hasPassword ??
    profile.isPasswordSet ??
    profile.passcodeSet ??
    profile.passcode_is_set ??
    profile.hasPasscode;
  return passwordStatusToSet(raw);
}

export function pickCustomerPinStatus(profile: Record<string, unknown>): "Set" | "Not Set" {
  const raw =
    profile.transactionPinStatus ??
    profile.transaction_pin_status ??
    profile.transactionPinSet ??
    profile.transaction_pin_set ??
    profile.isTransactionPinSet ??
    profile.pinSet ??
    profile.pin_set ??
    profile.isPinSet ??
    profile.is_pin_set ??
    profile.hasTransactionPin ??
    profile.has_transaction_pin ??
    profile.transactionPin ??
    profile.transaction_pin ??
    profile.hasPin ??
    profile.has_pin ??
    profile.isPinConfigured ??
    profile.pinStatus ??
    profile.pin_status;
  return passwordStatusToSet(raw);
}

export function pickCustomerSecurityQuestionStatus(profile: Record<string, unknown>): "Set" | "Not Set" {
  const raw =
    profile.securityQuestionStatus ??
    profile.security_question_status ??
    profile.securityQuestionSet ??
    profile.security_question_set ??
    profile.hasSecurityQuestion ??
    profile.has_security_question ??
    profile.securityQuestion ??
    profile.security_question;
  return passwordStatusToSet(raw);
}

function profileFlagTruthy(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

/** Whether the customer profile indicates an active Post No Debit flag. */
export function pickCustomerHasPnd(profile: Record<string, unknown>): boolean {
  if (
    profileFlagTruthy(profile.isPnd) ||
    profileFlagTruthy(profile.pnd) ||
    profileFlagTruthy(profile.hasPnd) ||
    profileFlagTruthy(profile.has_pnd)
  ) {
    return true;
  }
  const status = pickString(profile, [
    "pndStatus",
    "pnd_status",
    "postNoDebit",
    "post_no_debit",
    "postNoDebitStatus",
  ]);
  if (status) {
    const s = status.toLowerCase();
    if (s === "active" || s === "on" || s === "enabled" || s === "true" || s === "yes") return true;
    if (s === "inactive" || s === "off" || s === "disabled" || s === "false" || s === "no") return false;
  }
  const acct = pickString(profile, ["accountStatus", "account_status", "status"]).toLowerCase();
  return acct.includes("pnd");
}

function walletRecordHasLien(w: AdminCustomerWalletItem): boolean {
  const raw = w as unknown as Record<string, unknown>;
  if (
    profileFlagTruthy(raw.isLien) ||
    profileFlagTruthy(raw.lien) ||
    profileFlagTruthy(raw.hasLien) ||
    profileFlagTruthy(raw.has_lien)
  ) {
    return true;
  }
  const held = w.heldBalance ?? raw.held_balance;
  if (typeof held === "number" && held > 0) return true;
  const status = pickString(raw, ["lienStatus", "lien_status", "walletStatus", "status"]).toLowerCase();
  return status.includes("lien");
}

/** Whether the customer has an active wallet lien (profile flags and/or wallet list). */
export function pickCustomerHasLien(
  profile: Record<string, unknown>,
  wallets?: AdminCustomerWalletItem[],
): boolean {
  if (
    profileFlagTruthy(profile.isLien) ||
    profileFlagTruthy(profile.lien) ||
    profileFlagTruthy(profile.hasLien) ||
    profileFlagTruthy(profile.has_lien)
  ) {
    return true;
  }
  const status = pickString(profile, ["lienStatus", "lien_status", "walletLienStatus"]);
  if (status) {
    const s = status.toLowerCase();
    if (s === "active" || s === "on" || s === "enabled" || s === "true" || s === "yes") return true;
    if (s === "inactive" || s === "off" || s === "disabled" || s === "false" || s === "no") return false;
  }
  if (wallets?.some(walletRecordHasLien)) return true;
  const acct = pickString(profile, ["accountStatus", "account_status", "status"]).toLowerCase();
  return acct.includes("lien");
}

/** Prefer first non-referral wallet with an id for lien API calls. */
export function pickPrimaryWalletId(wallets: AdminCustomerWalletItem[]): string | undefined {
  for (const w of wallets) {
    const type = String(w.walletType ?? "").toLowerCase();
    if (type.includes("referral")) continue;
    const id = w.walletId?.trim();
    if (id) return id;
  }
  return wallets[0]?.walletId?.trim();
}

function humanizeKycStatus(raw: string): string {
  if (!raw) return "";
  const t = raw.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function formatKycDateValue(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return formatted.replace(/^(\w{3})\s/, "$1. ");
    }
    return value.trim();
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    const sec = obj.seconds ?? obj._seconds;
    if (typeof sec === "number") {
      const d = new Date(sec * 1000);
      if (!Number.isNaN(d.getTime())) {
        const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        return formatted.replace(/^(\w{3})\s/, "$1. ");
      }
    }
  }
  return "";
}

function pickKycStatus(o: Record<string, unknown>): string {
  const raw = pickString(o, [
    "status",
    "verificationStatus",
    "verification_status",
    "kycStatus",
    "kyc_status",
    "state",
    "approvalStatus",
    "approval_status",
  ]);
  return raw ? humanizeKycStatus(raw) : "";
}

function pickKycName(o: Record<string, unknown>, fallbackName?: string): string {
  const first = pickString(o, ["firstName", "first_name", "givenName"]);
  const last = pickString(o, ["lastName", "last_name", "familyName"]);
  const fromParts = [first, last].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  const full = pickString(o, ["fullName", "full_name", "name", "customerName", "displayName"]);
  if (full) return full;
  return fallbackName?.trim() ?? "";
}

function tierRecordFromArray(arr: unknown[], tier: 1 | 2): Record<string, unknown> | null {
  for (const item of arr) {
    const rec = asRecord(item);
    if (!rec) continue;
    const level = rec.tier ?? rec.tierLevel ?? rec.tier_level ?? rec.kycTier ?? rec.kyc_tier ?? rec.level;
    if (Number(level) === tier) return rec;
    if (tier === 1 && (rec.bvn != null || rec.BVN != null)) return rec;
    if (tier === 2 && (rec.idType != null || rec.id_type != null || rec.nin != null || rec.NIN != null)) return rec;
  }
  return null;
}

/** `GET /admin/customers/{accountId}/kyc` — AdminCustomerController_getCustomerKycDetails */
export function adminCustomerKycPath(accountId: string): string {
  return `/admin/customers/${encodeURIComponent(accountId.trim())}/kyc`;
}

function extractTierRecord(root: Record<string, unknown>, tier: 1 | 2): Record<string, unknown> | null {
  if (tier === 1) {
    const bvnBlock =
      asRecord(root.bvnVerification) ??
      asRecord(root.bvn_verification) ??
      asRecord(root.bvnDetails) ??
      asRecord(root.bvn_details);
    if (bvnBlock) return bvnBlock;
  } else {
    const ninBlock =
      asRecord(root.ninVerification) ??
      asRecord(root.nin_verification) ??
      asRecord(root.ninDetails) ??
      asRecord(root.nin_details);
    if (ninBlock) return ninBlock;
  }

  const tierKeys =
    tier === 1
      ? [
          "tier1",
          "tier_1",
          "tierOne",
          "tierOneDetails",
          "tier1Details",
          "tier_1_details",
          "tier1Verification",
          "kycTier1",
          "kyc_tier_1",
        ]
      : [
          "tier2",
          "tier_2",
          "tierTwo",
          "tierTwoDetails",
          "tier2Details",
          "tier_2_details",
          "tier2Verification",
          "kycTier2",
          "kyc_tier_2",
        ];

  for (const key of tierKeys) {
    const block = asRecord(root[key]);
    if (block) return block;
  }

  for (const key of ["tiers", "verifications", "records", "kycRecords", "kyc_records", "items"]) {
    const arr = root[key];
    if (Array.isArray(arr)) {
      const found = tierRecordFromArray(arr, tier);
      if (found) return found;
    }
  }

  for (const nestedKey of ["data", "kyc", "result", "payload", "customer"]) {
    const nested = asRecord(root[nestedKey]);
    if (nested && nested !== root) {
      const found = extractTierRecord(nested, tier);
      if (found) return found;
    }
  }

  if (tier === 1 && (root.bvn != null || root.BVN != null || root.dateOfBirth != null || root.date_of_birth != null)) {
    return root;
  }
  if (
    tier === 2 &&
    (root.idType != null ||
      root.id_type != null ||
      root.nin != null ||
      root.NIN != null ||
      root.idNumber != null ||
      root.id_number != null)
  ) {
    return root;
  }

  return null;
}

function normalizeTier1(raw: Record<string, unknown> | null, fallbackName?: string): AdminCustomerKycTier1 {
  const o = raw ?? {};
  return {
    name: pickKycName(o, fallbackName),
    bvn: pickString(o, ["bvn", "BVN", "bankVerificationNumber", "bank_verification_number"]),
    dateOfBirth: formatKycDateValue(
      o.dateOfBirth ?? o.date_of_birth ?? o.dob ?? o.birthDate ?? o.birth_date,
    ),
    status: pickKycStatus(o),
  };
}

function normalizeTier2(raw: Record<string, unknown> | null): AdminCustomerKycTier2 {
  const o = raw ?? {};
  const idType =
    pickString(o, ["idType", "id_type", "documentType", "document_type", "identificationType"]) ||
    (pickString(o, ["nin", "NIN"]) ? "NIN" : "");
  const idNumber = pickString(o, [
    "idNumber",
    "id_number",
    "nin",
    "NIN",
    "documentNumber",
    "document_number",
    "identificationNumber",
    "identification_number",
  ]);
  return {
    idType,
    idNumber,
    dateIssued: formatKycDateValue(o.dateIssued ?? o.date_issued ?? o.issuedAt ?? o.issued_at),
    dateOfExpiry: formatKycDateValue(
      o.dateOfExpiry ??
        o.date_of_expiry ??
        o.expiryDate ??
        o.expiry_date ??
        o.expiresAt ??
        o.expires_at ??
        o.expirationDate,
    ),
    status: pickKycStatus(o),
  };
}

/** Parse `GET /admin/customers/{accountId}/kyc` into Tier 1 / Tier 2 tables. */
export function normalizeCustomerKycResponse(data: unknown, fallbackName?: string): AdminCustomerKycDetails {
  if (Array.isArray(data)) {
    return {
      tier1: normalizeTier1(tierRecordFromArray(data, 1), fallbackName),
      tier2: normalizeTier2(tierRecordFromArray(data, 2)),
    };
  }

  const root = asRecord(data) ?? {};
  const tier1Raw = extractTierRecord(root, 1);
  const tier2Raw = extractTierRecord(root, 2);
  return {
    tier1: normalizeTier1(tier1Raw, fallbackName),
    tier2: normalizeTier2(tier2Raw),
  };
}

/**
 * KYC verification records for tiers 1 and 2.
 * OpenAPI: `AdminCustomerController_getCustomerKycDetails`
 */
export async function getAdminCustomerKyc(
  accountId: string,
  options?: { fallbackName?: string },
): Promise<AdminCustomerKycDetails> {
  const id = accountId.trim();
  if (!id) {
    throw new Error("Customer account ID is required");
  }
  const data = await adminRequest<unknown>(adminCustomerKycPath(id), {
    method: "GET",
    auth: true,
  });
  return normalizeCustomerKycResponse(data, options?.fallbackName);
}

export type AdminCustomerTransactionsQuery = {
  page?: number;
  pageSize?: number;
  fromDate?: string;
  toDate?: string;
  /** Used when transaction rows omit customer name (common on per-customer history). */
  customerDisplayName?: string;
};

function normalizeCustomerTransactionSummary(data: unknown): AdminCustomerTransactionSummary {
  const r = asRecord(data);
  if (!r) return {};
  const summary = asRecord(r.summary) ?? r;
  return {
    totalAvailableBalance: pickNum(summary, [
      "totalAvailableBalance",
      "total_available_balance",
      "availableBalance",
      "available_balance",
    ]),
    totalInflowAllTime: pickNum(summary, ["totalInflowAllTime", "total_inflow_all_time"]),
    totalOutflowAllTime: pickNum(summary, ["totalOutflowAllTime", "total_outflow_all_time"]),
    totalTransactionsAllTime: pickNum(summary, [
      "totalTransactionsAllTime",
      "total_transactions_all_time",
    ]),
    totalInflow: pickNum(summary, ["totalInflow", "total_inflow", "inflow"]),
    totalOutflow: pickNum(summary, ["totalOutflow", "total_outflow", "outflow"]),
    totalTransactions: pickNum(summary, ["totalTransactions", "total_transactions"]),
  };
}

function mapTransactionRowToCustomerRow(
  row: ReturnType<typeof normalizeTransactionListResponse>["items"][number],
  customerDisplayName?: string,
): AdminCustomerTransactionRow {
  const fallbackName = customerDisplayName?.trim();
  const customerName =
    row.customerName === "—" && fallbackName ? fallbackName : row.customerName;
  return {
    id: row.id,
    referenceNo: row.refNo,
    customerName,
    channel: row.channel,
    amount: row.amount,
    provider: row.provider,
    status: row.status,
    date: row.date,
  };
}

export async function getAdminCustomerTransactions(
  accountId: string,
  query?: AdminCustomerTransactionsQuery,
): Promise<AdminCustomerTransactionListResult> {
  const page = query?.page ?? 1;
  const pageSize = Math.min(100, Math.max(1, query?.pageSize ?? 25));
  const qs = buildQuery({
    page,
    pageSize,
    fromDate: query?.fromDate,
    toDate: query?.toDate,
  });
  const body = await adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}/transactions${qs}`, {
    method: "GET",
  });
  const normalized = normalizeTransactionListResponse(body, page, pageSize);
  const displayName = query?.customerDisplayName?.trim();
  return {
    items: normalized.items.map((row) => mapTransactionRowToCustomerRow(row, displayName)),
    total: normalized.total,
    page: normalized.page,
    pageSize: normalized.pageSize,
    summary: normalizeCustomerTransactionSummary(body),
  };
}

export async function getAdminCustomerWallets(accountId: string): Promise<AdminCustomerWalletsResponse> {
  const data = await adminRequest<unknown>(`/admin/customers/${encodeURIComponent(accountId)}/wallets`, { method: "GET" });
  const r = asRecord(data);
  if (!r) return {};
  const walletsRaw = r.wallets;
  const wallets = Array.isArray(walletsRaw)
    ? walletsRaw.map((w) => (asRecord(w) ?? {}) as AdminCustomerWalletItem)
    : undefined;
  return {
    wallets,
    totalCount: pickNum(r, ["totalCount", "total"]),
    nextPageToken: pickString(r, ["nextPageToken", "next_page_token"]) || undefined,
  };
}

/** Returns raw log objects for customer detail audit tab (see `audit-api` for normalized entries). */
export async function getAdminAuditCustomerLogs(accountId: string): Promise<Record<string, unknown>[]> {
  const { logs } = await fetchAdminAuditCustomerLogs(accountId);
  return logs.map((l) => l.raw);
}
