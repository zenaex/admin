import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminChangeAdminRoleBody,
  AdminCustomerReactivateBody,
  AdminCustomerSuspendBody,
} from "@/lib/admin-api/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when id is a UUID and not mock Team seed (`member-*`). */
export function isRealAdminId(id: string): boolean {
  const t = id.trim();
  if (!t || t.startsWith("member-")) return false;
  return UUID_RE.test(t);
}

/** Map invite / Team UI role labels to API `newRole` slugs (OpenAPI enum). */
const UI_ROLE_TO_API: Record<string, string> = {
  "super admin": "super_admin",
  superadmin: "super_admin",
  super_admin: "super_admin",
  admin: "admin",
  operations: "support",
  "ops manager": "support",
  ops_manager: "support",
  compliance: "compliance",
  "customer care": "support",
  customer_care: "support",
  "tech support": "support",
  tech_support: "support",
};

export function uiRoleLabelToApiRole(label: string): string {
  const key = label.trim().toLowerCase();
  if (UI_ROLE_TO_API[key]) return UI_ROLE_TO_API[key];
  const slug = key.replace(/\s+/g, "_");
  if (UI_ROLE_TO_API[slug]) return UI_ROLE_TO_API[slug];
  return slug;
}

function adminPath(adminId: string, action: "role" | "deactivate"): string {
  return `/admin/users/admin/${encodeURIComponent(adminId.trim())}/${action}`;
}

function customerPath(accountId: string, action: "deactivate" | "suspend" | "reactivate"): string {
  return `/admin/users/customer/${encodeURIComponent(accountId.trim())}/${action}`;
}

export async function postAdminUserChangeRole(
  adminId: string,
  body: AdminChangeAdminRoleBody,
): Promise<void> {
  await adminRequest<unknown>(adminPath(adminId, "role"), {
    method: "POST",
    auth: true,
    body: JSON.stringify(body),
  });
}

export async function postAdminUserDeactivate(adminId: string): Promise<void> {
  await adminRequest<unknown>(adminPath(adminId, "deactivate"), {
    method: "POST",
    auth: true,
  });
}

export async function postCustomerDeactivate(accountId: string): Promise<void> {
  await adminRequest<unknown>(customerPath(accountId, "deactivate"), {
    method: "POST",
    auth: true,
  });
}

export async function postCustomerSuspend(
  accountId: string,
  body: AdminCustomerSuspendBody,
): Promise<void> {
  const reason = body.reason.trim();
  const notes = body.notes.trim();
  if (!reason || !notes) {
    throw new Error("Reason and notes are required");
  }
  await adminRequest<unknown>(customerPath(accountId, "suspend"), {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      reason,
      notes,
      ...(body.suspendedUntil ? { suspendedUntil: body.suspendedUntil } : {}),
      ...(body.customerMessage ? { customerMessage: body.customerMessage } : {}),
    }),
  });
}

export async function postCustomerReactivate(
  accountId: string,
  body: AdminCustomerReactivateBody,
): Promise<void> {
  const reason = body.reason.trim();
  if (!reason) {
    throw new Error("Reason is required");
  }
  await adminRequest<unknown>(customerPath(accountId, "reactivate"), {
    method: "POST",
    auth: true,
    body: JSON.stringify({ reason }),
  });
}

export type CustomerAccountStatusKind = "active" | "inactive" | "unknown";

/** Classify profile account status for action menu visibility. */
export function classifyCustomerAccountStatus(statusRaw: string): CustomerAccountStatusKind {
  const s = statusRaw.trim().toLowerCase();
  if (!s) return "unknown";
  if (
    s.includes("suspend") ||
    s.includes("block") ||
    s.includes("deactiv") ||
    s.includes("inactive") ||
    s.includes("closed") ||
    s.includes("banned")
  ) {
    return "inactive";
  }
  if (s.includes("active") || s === "enabled" || s === "open") return "active";
  return "unknown";
}
