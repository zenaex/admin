import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminAuditActivityLogEntry,
  AdminAuditSubjectDetails,
  AdminAuditTrailRow,
} from "@/lib/admin-api/types";

function pickString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickNestedString(o: Record<string, unknown>, paths: string[][]): string {
  for (const path of paths) {
    let cur: unknown = o;
    for (const key of path) {
      const rec = asRecord(cur);
      if (!rec) {
        cur = undefined;
        break;
      }
      cur = rec[key];
    }
    if (typeof cur === "string" && cur.trim()) return cur.trim();
  }
  return "";
}

/** Merge nested customer/user/session objects so list rows pick up email and action. */
function flattenAuditSources(o: Record<string, unknown>): Record<string, unknown> {
  const nested = [
    asRecord(o.metadata),
    asRecord(o.lastLog),
    asRecord(o.lastActivity),
    asRecord(o.latestActivity),
    asRecord(o.recentActivity),
    asRecord(o.session),
    asRecord(o.subject),
    asRecord(o.profile),
    asRecord(o.account),
    asRecord(o.customer),
    asRecord(o.user),
    asRecord(o.admin),
  ].filter((x): x is Record<string, unknown> => x !== null);

  const flat: Record<string, unknown> = {};
  for (const n of nested) Object.assign(flat, n);
  Object.assign(flat, o);
  return flat;
}

function extractItemsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  const inner =
    r.data ??
    r.items ??
    r.results ??
    r.sessions ??
    r.users ??
    r.rows ??
    r.records ??
    r.logs ??
    r.content ??
    r.accounts ??
    r.customers ??
    r.auditSessions;
  if (Array.isArray(inner)) return inner;
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested =
      dataInner.items ??
      dataInner.sessions ??
      dataInner.users ??
      dataInner.results ??
      dataInner.content ??
      dataInner.customers ??
      dataInner.accounts;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function extractLogsArray(data: unknown): unknown[] {
  const r = asRecord(data);
  if (r) {
    for (const key of ["logs", "activities", "events", "auditLogs", "audit_logs", "entries", "history"]) {
      const val = r[key];
      if (Array.isArray(val)) return val;
    }
  }
  return extractItemsArray(data);
}

function formatDisplayDate(isoOrAny: string): string {
  if (!isoOrAny) return "—";
  const d = new Date(isoOrAny);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return isoOrAny;
}

function humanizeLabel(s: string): string {
  if (!s) return "";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function isValidEmail(s: string): boolean {
  const v = s.trim();
  return v.includes("@") && v.length > 3 && !/^[-–—=]+$/.test(v);
}

/** Walk nested objects for any email-shaped string (audit sessions often omit top-level email). */
function findEmailDeep(v: unknown, depth = 0): string {
  if (depth > 6) return "";
  if (typeof v === "string" && isValidEmail(v)) return v.trim();
  const r = asRecord(v);
  if (!r) return "";
  for (const [key, val] of Object.entries(r)) {
    if (/email/i.test(key) && typeof val === "string" && isValidEmail(val)) return val.trim();
  }
  for (const val of Object.values(r)) {
    const found = findEmailDeep(val, depth + 1);
    if (found) return found;
  }
  return "";
}

function accountIdFromRecord(o: Record<string, unknown>): string {
  return pickString(o, [
    "accountId",
    "account_id",
    "customerId",
    "customer_id",
    "userId",
    "user_id",
    "uuid",
    "id",
  ]);
}

/** Index parallel `customers` / `accounts` / `users` arrays from the same audit payload. */
function buildAccountLookupMap(data: unknown): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  const roots: Record<string, unknown>[] = [];
  const r = asRecord(data);
  if (r) {
    roots.push(r);
    const dataInner = asRecord(r.data);
    if (dataInner) roots.push(dataInner);
  }
  for (const root of roots) {
    for (const key of ["customers", "accounts", "users", "profiles", "subjects", "items"]) {
      const arr = root[key];
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        const rec = asRecord(item);
        if (!rec) continue;
        const id = accountIdFromRecord(rec);
        if (!id) continue;
        const prev = map.get(id) ?? {};
        map.set(id, { ...prev, ...rec });
      }
    }
  }
  return map;
}

function extractCustomerAuditItems(data: unknown): unknown[] {
  const lookup = buildAccountLookupMap(data);
  const r = asRecord(data);
  let sessions: unknown[] = [];

  if (r) {
    for (const key of ["sessions", "auditSessions", "sessionList", "session_list"]) {
      const val = r[key];
      if (Array.isArray(val)) {
        sessions = val;
        break;
      }
    }
    if (sessions.length === 0) {
      const dataInner = asRecord(r.data);
      if (dataInner) {
        for (const key of ["sessions", "auditSessions", "items", "content"]) {
          const val = dataInner[key];
          if (Array.isArray(val)) {
            sessions = val;
            break;
          }
        }
      }
    }
  }
  if (sessions.length === 0) sessions = extractItemsArray(data);

  return sessions.map((raw) => {
    const o = asRecord(raw);
    if (!o) return raw;
    const id = accountIdFromRecord(o);
    const match = id ? lookup.get(id) : undefined;
    if (match) return { ...match, ...o };
    return raw;
  });
}

function pickEmail(o: Record<string, unknown>, flat: Record<string, unknown>): string {
  return (
    pickString(flat, [
      "email",
      "emailAddress",
      "email_address",
      "userEmail",
      "customerEmail",
      "primaryEmail",
      "contactEmail",
      "mail",
      "eMail",
    ]) ||
    pickNestedString(o, [
      ["customer", "email"],
      ["customer", "emailAddress"],
      ["user", "email"],
      ["user", "emailAddress"],
      ["account", "email"],
      ["profile", "email"],
      ["subject", "email"],
      ["contact", "email"],
      ["credentials", "email"],
      ["auth", "email"],
    ]) ||
    findEmailDeep(flat) ||
    findEmailDeep(o)
  );
}

async function buildCustomerEmailLookup(accountIds: string[]): Promise<Map<string, string>> {
  const needed = new Set(accountIds.filter(Boolean));
  const found = new Map<string, string>();
  if (needed.size === 0) return found;

  let page = 1;
  const pageSize = 100;
  while (page <= 40) {
    const body = await adminRequest<unknown>(
      `/admin/customers?page=${page}&pageSize=${pageSize}`,
      { method: "GET" },
    );
    const batch = extractItemsArray(body);
    if (batch.length === 0) break;

    for (const raw of batch) {
      const o = asRecord(raw);
      if (!o) continue;
      const id = accountIdFromRecord(o);
      const email = pickEmail(o, flattenAuditSources(o));
      if (id && email) found.set(id, email);
    }

    if (found.size >= needed.size) break;
    if (batch.length < pageSize) break;
    page += 1;
  }

  return found;
}

function applyEmailLookup(rows: AdminAuditTrailRow[], lookup: Map<string, string>): AdminAuditTrailRow[] {
  if (lookup.size === 0) return rows;
  return rows.map((row) => {
    if (row.email && row.email !== "—") return row;
    const email = lookup.get(row.subjectId);
    return email ? { ...row, email } : row;
  });
}

function pickAction(
  o: Record<string, unknown>,
  flat: Record<string, unknown>,
  sessionInRaw: string,
  sessionOutRaw: string,
): string {
  const fromLastLog = pickNestedString(o, [
    ["lastLog", "message"],
    ["lastLog", "action"],
    ["lastLog", "description"],
    ["lastActivity", "message"],
    ["lastActivity", "action"],
    ["lastActivity", "type"],
    ["latestActivity", "message"],
    ["recentActivity", "message"],
  ]);

  const explicit =
    pickString(flat, [
      "action",
      "lastAction",
      "last_action",
      "lastActivity",
      "last_activity",
      "activity",
      "activityType",
      "activity_type",
      "event",
      "eventType",
      "event_type",
      "description",
      "message",
      "summary",
      "title",
      "operation",
      "lastOperation",
      "recentAction",
      "sessionAction",
      "session_action",
      "logType",
      "log_type",
      "type",
    ]) || fromLastLog;

  if (explicit) return humanizeLabel(explicit);

  if (sessionInRaw && sessionOutRaw) return "Session ended";
  if (sessionInRaw) return "Active session";
  return "";
}

export function normalizeAuditSessionRow(
  raw: unknown,
  subjectType: AdminAuditTrailRow["subjectType"],
  idx: number,
): AdminAuditTrailRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const flat = flattenAuditSources(o);

  const subjectId =
    (subjectType === "customers"
      ? pickString(flat, ["accountId", "account_id", "customerId", "customer_id", "userId", "user_id"])
      : pickString(flat, ["adminId", "admin_id", "userId", "user_id"])) ||
    pickString(flat, ["id", "uuid"]) ||
    (subjectType === "internal" ? pickString(o, ["admin_id"]) : pickString(o, ["account_id"])) ||
    "";
  if (!subjectId) return null;

  const rowKey =
    pickString(flat, ["sessionId", "session_id", "logId", "log_id"]) ||
    `${subjectId}-${idx}`;

  const first =
    pickString(flat, ["firstName", "first_name"]) ||
    pickNestedString(o, [["customer", "firstName"], ["user", "firstName"]]);
  const last =
    pickString(flat, ["lastName", "last_name"]) ||
    pickNestedString(o, [["customer", "lastName"], ["user", "lastName"]]);
  const emailForName = pickEmail(o, flat);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(flat, ["name", "fullName", "displayName", "customerName", "adminName"]) ||
    pickNestedString(o, [["customer", "name"], ["customer", "fullName"], ["user", "name"]]) ||
    emailForName ||
    subjectId;

  const email = pickEmail(o, flat) || "—";

  const roleRaw =
    pickString(flat, ["role", "userRole", "adminRole", "accountRole"]) ||
    pickString(flat, ["username", "userName", "handle"]) ||
    pickNestedString(o, [["customer", "username"], ["user", "username"]]) ||
    "";
  const role =
    subjectType === "customers" && roleRaw && !roleRaw.startsWith("@")
      ? `@${roleRaw}`
      : roleRaw
        ? humanizeLabel(roleRaw)
        : email.includes("@")
          ? `@${email.split("@")[0]}`
          : "—";

  const sessionInRaw =
    pickString(flat, [
      "sessionIn",
      "session_in",
      "loginAt",
      "login_at",
      "startedAt",
      "started_at",
      "createdAt",
      "created_at",
      "sessionStart",
      "session_start",
    ]) || "";
  const sessionOutRaw =
    pickString(flat, [
      "sessionOut",
      "session_out",
      "logoutAt",
      "logout_at",
      "endedAt",
      "ended_at",
      "sessionEnd",
      "session_end",
      "lastSeenAt",
      "last_seen_at",
    ]) || "";

  const action = pickAction(o, flat, sessionInRaw, sessionOutRaw) || "—";

  return {
    id: `${subjectType}:${rowKey}`,
    subjectId,
    subjectType,
    name,
    email,
    role,
    action,
    sessionIn: sessionInRaw ? formatDisplayDate(sessionInRaw) : "—",
    sessionOut: sessionOutRaw ? formatDisplayDate(sessionOutRaw) : "—",
    raw: o,
  };
}

export function normalizeAuditSessionList(
  data: unknown,
  subjectType: AdminAuditTrailRow["subjectType"],
): AdminAuditTrailRow[] {
  const items =
    subjectType === "customers" ? extractCustomerAuditItems(data) : extractItemsArray(data);
  return items
    .map((row, idx) => normalizeAuditSessionRow(row, subjectType, idx))
    .filter((x): x is AdminAuditTrailRow => x !== null);
}

/** `GET /admin/audit/internal-users` — admin user sessions for audit trail list. */
export async function getAdminAuditInternalUserSessions(): Promise<AdminAuditTrailRow[]> {
  const body = await adminRequest<unknown>("/admin/audit/internal-users", { method: "GET" });
  return normalizeAuditSessionList(body, "internal");
}

/** `GET /admin/audit/customers` — customer sessions for audit trail list. */
export async function getAdminAuditCustomerSessions(): Promise<AdminAuditTrailRow[]> {
  const body = await adminRequest<unknown>("/admin/audit/customers", { method: "GET" });
  let rows = normalizeAuditSessionList(body, "customers");

  const missingIds = rows
    .filter((r) => !r.email || r.email === "—")
    .map((r) => r.subjectId);
  if (missingIds.length > 0) {
    const lookup = await buildCustomerEmailLookup(missingIds);
    rows = applyEmailLookup(rows, lookup);
  }

  return rows;
}

export function normalizeAuditActivityLogs(data: unknown): AdminAuditActivityLogEntry[] {
  const arr = extractLogsArray(data);
  return arr
    .map((raw, idx) => {
      const o = asRecord(raw);
      if (!o) return null;
      const flat = flattenAuditSources(o);
      const id = pickString(flat, ["id", "logId", "uuid"]) || `log-${idx}`;
      const timeRaw =
        pickString(flat, ["timestamp", "createdAt", "created_at", "time", "date", "occurredAt"]) ||
        "";
      const message =
        pickString(flat, [
          "message",
          "action",
          "description",
          "event",
          "activity",
          "title",
          "summary",
          "activityType",
          "activity_type",
          "eventType",
          "event_type",
          "type",
        ]) || "—";
      const userAgent =
        pickString(flat, ["userAgent", "user_agent", "device", "browser", "client"]) || "—";
      const ip =
        pickString(flat, ["ip", "ipAddress", "ip_address", "clientIp", "client_ip"]) || "—";
      return {
        id,
        time: timeRaw ? formatDisplayDate(timeRaw) : "—",
        message: humanizeLabel(message) || message,
        userAgent,
        ip,
        raw: o,
      };
    })
    .filter((x): x is AdminAuditActivityLogEntry => x !== null);
}

export function extractAuditSubjectDetails(
  data: unknown,
  subjectType: AdminAuditTrailRow["subjectType"],
): AdminAuditSubjectDetails {
  const r = asRecord(data);
  if (!r) {
    return {
      name: "—",
      role: "—",
      phoneNumber: "—",
      emailAddress: "—",
      dateAdded: "—",
    };
  }

  const user =
    asRecord(r.user) ??
    asRecord(r.admin) ??
    asRecord(r.customer) ??
    asRecord(r.account) ??
    asRecord(r.subject) ??
    asRecord(r.profile) ??
    r;

  const flat = flattenAuditSources({ ...user, ...r });

  const first = pickString(flat, ["firstName", "first_name"]);
  const last = pickString(flat, ["lastName", "last_name"]);
  const email = pickEmail(r, flat);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(flat, ["name", "fullName", "displayName", "customerName"]) ||
    email ||
    "—";

  const roleRaw =
    pickString(flat, ["role", "userRole", "adminRole", "username", "handle"]) || "";
  const role =
    subjectType === "customers" && roleRaw && !roleRaw.startsWith("@")
      ? `@${roleRaw}`
      : roleRaw
        ? humanizeLabel(roleRaw)
        : email.includes("@")
          ? `@${email.split("@")[0]}`
          : "—";

  const dateRaw =
    pickString(flat, ["createdAt", "created_at", "dateAdded", "onboardedAt", "joinedAt"]) || "";

  return {
    name,
    role,
    phoneNumber:
      pickString(flat, ["phone", "phoneNumber", "mobile", "msisdn"]) ||
      pickNestedString(r, [["customer", "phone"], ["user", "phone"]]) ||
      "—",
    emailAddress: email || "—",
    dateAdded: dateRaw ? formatDisplayDate(dateRaw) : "—",
  };
}

/** `GET /admin/audit/internal-users/{adminId}/logs` */
export async function getAdminAuditInternalUserLogs(adminId: string): Promise<{
  subject: AdminAuditSubjectDetails;
  logs: AdminAuditActivityLogEntry[];
}> {
  const body = await adminRequest<unknown>(
    `/admin/audit/internal-users/${encodeURIComponent(adminId)}/logs`,
    { method: "GET" },
  );
  return {
    subject: extractAuditSubjectDetails(body, "internal"),
    logs: normalizeAuditActivityLogs(body),
  };
}

/** `GET /admin/audit/customers/{accountId}/logs` */
export async function getAdminAuditCustomerLogs(accountId: string): Promise<{
  subject: AdminAuditSubjectDetails;
  logs: AdminAuditActivityLogEntry[];
}> {
  const body = await adminRequest<unknown>(
    `/admin/audit/customers/${encodeURIComponent(accountId)}/logs`,
    { method: "GET" },
  );
  let subject = extractAuditSubjectDetails(body, "customers");
  if (!subject.emailAddress || subject.emailAddress === "—") {
    try {
      const profile = await adminRequest<unknown>(
        `/admin/customers/${encodeURIComponent(accountId)}`,
        { method: "GET" },
      );
      const pr = asRecord(profile);
      const flat = pr ? flattenAuditSources(pr) : {};
      const email = pr ? pickEmail(pr, flat) : "";
      if (email) subject = { ...subject, emailAddress: email };
    } catch {
      /* profile optional */
    }
  }
  return {
    subject,
    logs: normalizeAuditActivityLogs(body),
  };
}
