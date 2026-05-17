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

function extractItemsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  const inner =
    r.data ?? r.items ?? r.results ?? r.sessions ?? r.users ?? r.rows ?? r.records ?? r.logs;
  if (Array.isArray(inner)) return inner;
  const dataInner = asRecord(r.data);
  if (dataInner) {
    const nested = dataInner.items ?? dataInner.sessions ?? dataInner.users ?? dataInner.results;
    if (Array.isArray(nested)) return nested;
  }
  return [];
}

function formatDisplayDate(isoOrAny: string): string {
  if (!isoOrAny) return "—";
  const d = new Date(isoOrAny);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return isoOrAny;
}

function humanizeRole(s: string): string {
  if (!s) return "—";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function normalizeAuditSessionRow(
  raw: unknown,
  subjectType: AdminAuditTrailRow["subjectType"],
  idx: number,
): AdminAuditTrailRow | null {
  const o = asRecord(raw);
  if (!o) return null;

  const subjectId =
    pickString(o, ["adminId", "accountId", "userId", "id", "uuid"]) ||
    (subjectType === "internal" ? pickString(o, ["admin_id"]) : pickString(o, ["account_id"])) ||
    "";
  if (!subjectId) return null;

  const first = pickString(o, ["firstName", "first_name"]);
  const last = pickString(o, ["lastName", "last_name"]);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(o, ["name", "fullName", "displayName", "customerName", "adminName"]) ||
    pickString(o, ["email"]) ||
    subjectId;

  const email = pickString(o, ["email", "emailAddress"]) || "—";

  const roleRaw =
    pickString(o, ["role", "userRole", "adminRole"]) ||
    pickString(o, ["username", "userName", "handle"]) ||
    "";
  const role =
    subjectType === "customers" && roleRaw && !roleRaw.startsWith("@")
      ? `@${roleRaw}`
      : roleRaw
        ? humanizeRole(roleRaw)
        : "—";

  const action =
    pickString(o, [
      "action",
      "lastAction",
      "last_action",
      "activity",
      "description",
      "event",
      "message",
    ]) || "—";

  const sessionInRaw =
    pickString(o, ["sessionIn", "session_in", "loginAt", "startedAt", "createdAt", "sessionStart"]) ||
    "";
  const sessionOutRaw =
    pickString(o, ["sessionOut", "session_out", "logoutAt", "endedAt", "sessionEnd"]) || "";

  return {
    id: `${subjectType}:${subjectId}`,
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
  const arr = extractItemsArray(data);
  return arr
    .map((raw, idx) => {
      const o = asRecord(raw);
      if (!o) return null;
      const id = pickString(o, ["id", "logId", "uuid"]) || `log-${idx}`;
      const timeRaw =
        pickString(o, ["timestamp", "createdAt", "created_at", "time", "date"]) || "";
      const message =
        pickString(o, ["message", "action", "description", "event", "activity"]) || "—";
      const userAgent = pickString(o, ["userAgent", "user_agent", "device", "browser"]) || "—";
      const ip = pickString(o, ["ip", "ipAddress", "ip_address", "clientIp"]) || "—";
      return {
        id,
        time: timeRaw ? formatDisplayDate(timeRaw) : "—",
        message,
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
    asRecord(r.subject) ??
    r;

  const first = pickString(user, ["firstName", "first_name"]);
  const last = pickString(user, ["lastName", "last_name"]);
  const name =
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(user, ["name", "fullName", "displayName"]) ||
    "—";

  const roleRaw = pickString(user, ["role", "userRole", "adminRole", "username"]);
  const role =
    subjectType === "customers" && roleRaw && !roleRaw.startsWith("@")
      ? `@${roleRaw}`
      : roleRaw
        ? humanizeRole(roleRaw)
        : "—";

  const dateRaw =
    pickString(user, ["createdAt", "created_at", "dateAdded", "onboardedAt"]) || "";

  return {
    name,
    role,
    phoneNumber: pickString(user, ["phone", "phoneNumber", "mobile"]) || "—",
    emailAddress: pickString(user, ["email", "emailAddress"]) || "—",
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
