/**
 * Admin Team Management API — `/admin/team` and `/admin/invitations` endpoints.
 */
import { adminRequest, adminUrl } from "@/lib/admin-api/client";
import type {
  AdminPendingInvite,
  AdminPendingInviteListResult,
  AdminTeamInviteBody,
  AdminTeamListResult,
  AdminTeamMember,
  AdminTeamUpdateBody,
  AdminRole,
  AdminTeamDeactivateBody,
  AdminTeamSuspendBody,
} from "@/lib/admin-api/types";

/* ── Helpers ── */

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function pickStr(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function formatDate(raw: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function humanizeStatus(s: string): string {
  if (!s) return "—";
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function humanizeRole(s: string): string {
  if (!s) return "—";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/* ── Normalizers ── */

function normalizeTeamMember(raw: unknown): AdminTeamMember | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickStr(o, ["id", "adminId", "userId", "uuid"]);
  if (!id) return null;

  const firstName = pickStr(o, ["firstName", "first_name", "givenName"]);
  const lastName = pickStr(o, ["lastName", "last_name", "familyName"]);
  const fullFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
  const name = fullFromParts || pickStr(o, ["fullName", "full_name", "name", "displayName"]) || pickStr(o, ["email"]) || id;

  const email = pickStr(o, ["email", "emailAddress"]) || "—";
  const phone = pickStr(o, ["phone", "phoneNumber", "mobile"]) || "—";
  const roleRaw = pickStr(o, ["role", "roleName", "adminRole"]);
  const role = roleRaw ? humanizeRole(roleRaw) : "—";
  
  const roleId = pickStr(o, ["roleId", "role_id", "adminRoleId"]) || "";
  const department = pickStr(o, ["department", "dept"]) || "—";

  const statusRaw = pickStr(o, ["status", "accountStatus", "adminStatus"]);
  const status = statusRaw ? humanizeStatus(statusRaw) : "—";

  const dateRaw = pickStr(o, ["createdAt", "created_at", "dateOnboarded", "dateAdded", "joinedAt"]);
  const dateOnboarded = dateRaw ? formatDate(dateRaw) : "—";

  return { id, name, firstName, lastName, email, phone, role, roleId, status, dateOnboarded, department };
}

function normalizeInvitation(raw: unknown): AdminPendingInvite | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickStr(o, ["id", "invitationId", "uuid"]);
  if (!id) return null;

  const email = pickStr(o, ["email", "emailAddress"]) || "—";
  const firstName = pickStr(o, ["firstName", "first_name"]);
  const lastName = pickStr(o, ["lastName", "last_name"]);
  const roleRaw = pickStr(o, ["role", "roleName", "adminRole"]);
  const role = roleRaw ? humanizeRole(roleRaw) : "—";

  const dateRaw = pickStr(o, ["createdAt", "created_at", "dateSent", "sentAt", "dateInvited"]);
  const dateSent = dateRaw ? formatDate(dateRaw) : "—";

  const statusRaw = pickStr(o, ["status"]);
  const status = statusRaw ? humanizeStatus(statusRaw) : "Pending";

  return { id, email, firstName, lastName, role, dateSent, status };
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  for (const key of ["data", "items", "members", "team", "results", "admins", "users", "records", "list", "content", "invitations"]) {
    const v = r[key];
    if (Array.isArray(v)) return v;
  }
  // Check nested data
  const inner = asRecord(r.data);
  if (inner) {
    for (const key of ["items", "members", "team", "results", "invitations"]) {
      const v = inner[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function extractTotal(data: unknown, fallback: number): number {
  const r = asRecord(data);
  if (!r) return fallback;
  for (const key of ["total", "totalCount", "count", "totalItems", "totalElements"]) {
    const v = r[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
  }
  const inner = asRecord(r.data) ?? asRecord(r.meta) ?? asRecord(r.pagination);
  if (inner) {
    for (const key of ["total", "totalCount", "count"]) {
      const v = inner[key];
      if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
    }
  }
  return fallback;
}

/* ── Team endpoints ── */

/** `GET /admin/team` — List all admin team members. */
export async function getAdminTeamList(): Promise<AdminTeamListResult> {
  const data = await adminRequest<unknown>("/admin/team", { method: "GET" });
  const raw = extractArray(data);
  const items = raw.map(normalizeTeamMember).filter((x): x is AdminTeamMember => x !== null);
  const total = extractTotal(data, items.length);
  return { items, total };
}

/** `POST /admin/team` — Invite a new team member (sends invitation email). */
export async function postAdminTeamInvite(body: AdminTeamInviteBody): Promise<unknown> {
  return adminRequest("/admin/team", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

/** `GET /admin/team/export` — Export team member list as CSV/Excel (downloads blob). */
export async function getAdminTeamExportUrl(): Promise<string> {
  return adminUrl("/admin/team/export");
}

/** `GET /admin/team/{id}` — Get admin team member detail. */
export async function getAdminTeamMember(id: string): Promise<AdminTeamMember | null> {
  const data = await adminRequest<unknown>(`/admin/team/${encodeURIComponent(id)}`, { method: "GET" });
  const r = asRecord(data);
  const inner = r ? (asRecord(r.data) ?? asRecord(r.member) ?? asRecord(r.admin) ?? r) : null;
  return inner ? normalizeTeamMember(inner) : null;
}

/** `PUT /admin/team/{id}` — Update admin team member details. */
export async function putAdminTeamMember(id: string, body: AdminTeamUpdateBody): Promise<void> {
  await adminRequest(`/admin/team/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
    auth: true,
  });
}

/** `POST /admin/team/{id}/deactivate` — Deactivate an admin account. */
export async function postAdminTeamDeactivate(id: string, body: AdminTeamDeactivateBody): Promise<void> {
  await adminRequest(`/admin/team/${encodeURIComponent(id)}/deactivate`, {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

/** `POST /admin/team/{id}/suspend` — Suspend an admin account. */
export async function postAdminTeamSuspend(id: string, body: AdminTeamSuspendBody): Promise<void> {
  await adminRequest(`/admin/team/${encodeURIComponent(id)}/suspend`, {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

/** `POST /admin/team/{id}/activate` — Activate (unsuspend/re-enable) an admin account. */
export async function postAdminTeamActivate(id: string): Promise<void> {
  await adminRequest(`/admin/team/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    auth: true,
  });
}

/** `POST /admin/team/{id}/reset-password` — Force-reset admin password (sends email). */
export async function postAdminTeamResetPassword(id: string): Promise<void> {
  await adminRequest(`/admin/team/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    auth: true,
  });
}


/* ── Invitation endpoints ── */

/** `GET /admin/invitations` — List pending admin invitations. */
export async function getAdminInvitations(): Promise<AdminPendingInviteListResult> {
  const data = await adminRequest<unknown>("/admin/invitations", { method: "GET" });
  const raw = extractArray(data);
  const items = raw.map(normalizeInvitation).filter((x): x is AdminPendingInvite => x !== null);
  const total = extractTotal(data, items.length);
  return { items, total };
}

/** `POST /admin/invitations/{id}/resend` — Resend a pending or expired invitation. */
export async function postAdminInvitationResend(id: string): Promise<void> {
  await adminRequest(`/admin/invitations/${encodeURIComponent(id)}/resend`, {
    method: "POST",
    auth: true,
  });
}

/** `DELETE /admin/invitations/{id}` — Cancel a pending invitation. */
export async function deleteAdminInvitation(id: string): Promise<void> {
  await adminRequest(`/admin/invitations/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

/** `GET /admin/roles` — List all admin roles. */
export async function getAdminRoles(): Promise<AdminRole[]> {
  const data = await adminRequest<unknown>("/admin/roles", { method: "GET" });
  const rawList = (() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const r = data as Record<string, unknown>;
      const list = r.roles ?? r.items ?? r.data;
      if (Array.isArray(list)) return list;
    }
    return [];
  })();

  return rawList.map((item: unknown): AdminRole => {
    if (item && typeof item === "object") {
      const r = item as Record<string, unknown>;
      const id = String(r.id ?? r.roleId ?? r.value ?? "");
      const name = String(r.name ?? r.role ?? r.label ?? "");
      const description = r.description ? String(r.description) : undefined;
      return { id, name, description };
    }
    const val = String(item);
    return { id: val, name: val };
  });
}
