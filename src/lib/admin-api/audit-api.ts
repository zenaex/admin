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
    ]) ||
    pickNestedString(o, [
      ["customer", "email"],
      ["customer", "emailAddress"],
      ["user", "email"],
      ["account", "email"],
      ["profile", "email"],
      ["subject", "email"],
      ["admin", "email"],
    ])
  );
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
  return extractItemsArray(data)
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
  return normalizeAuditSessionList(body, "customers");
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
  return {
    subject: extractAuditSubjectDetails(body, "customers"),
    logs: normalizeAuditActivityLogs(body),
  };
}
