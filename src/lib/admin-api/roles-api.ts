/**
 * Admin Roles & Permissions API — `/admin/roles` and `/admin/permissions`.
 */
import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminPermissionItem,
  AdminPermissionModule,
  AdminRole,
  AdminRoleDetail,
  AdminRoleListItem,
  AdminRoleMemberPreview,
  AdminRoleUpsertBody,
} from "@/lib/admin-api/types";

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

function pickNum(o: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
    if (typeof v === "string" && /^\d+$/.test(v)) return Number.parseInt(v, 10);
  }
  return 0;
}

function pickBool(o: Record<string, unknown>, keys: string[]): boolean {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "boolean") return v;
    if (v === "true" || v === 1) return true;
  }
  return false;
}

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const r = asRecord(data);
  if (!r) return [];
  for (const key of [
    "data",
    "items",
    "roles",
    "permissions",
    "modules",
    "members",
    "results",
    "list",
    "content",
  ]) {
    const v = r[key];
    if (Array.isArray(v)) return v;
  }
  const inner = asRecord(r.data);
  if (inner) {
    for (const key of ["items", "roles", "permissions", "modules", "members"]) {
      const v = inner[key];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

function extractPermissionKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string" && item.trim()) return item.trim();
      const o = asRecord(item);
      if (!o) return "";
      return pickStr(o, ["key", "permissionKey", "permission_key", "id", "name"]);
    })
    .filter(Boolean);
}

function normalizePermissionItem(raw: unknown): AdminPermissionItem | null {
  const o = asRecord(raw);
  if (!o) return null;
  const key = pickStr(o, ["key", "permissionKey", "permission_key", "id", "name", "slug"]);
  if (!key) return null;
  const label = pickStr(o, ["label", "name", "title", "displayName", "description"]) || key;
  const description = pickStr(o, ["description", "summary", "helpText"]) || undefined;
  return { key, label, description: description !== label ? description : undefined };
}

function normalizePermissionModule(raw: unknown): AdminPermissionModule | null {
  const o = asRecord(raw);
  if (!o) return null;
  const module =
    pickStr(o, ["module", "moduleName", "module_name", "group", "category", "name"]) || "General";
  const permsRaw = o.permissions ?? o.items ?? o.permissionList ?? o.permission_list;
  const permissions = extractArray(permsRaw)
    .map(normalizePermissionItem)
    .filter((x): x is AdminPermissionItem => x !== null);
  if (permissions.length === 0) {
    const single = normalizePermissionItem(raw);
    if (single) return { module, permissions: [single] };
    return null;
  }
  return { module, permissions };
}

function normalizeRoleListItem(raw: unknown): AdminRoleListItem | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickStr(o, ["id", "roleId", "uuid"]);
  const name = pickStr(o, ["name", "role", "roleName", "label"]);
  if (!id || !name) return null;
  const description = pickStr(o, ["description", "summary"]) || "—";
  const icon = pickStr(o, ["icon", "iconName", "icon_key"]) || "setting2";
  const memberCount = pickNum(o, ["memberCount", "member_count", "membersCount", "members", "activeMembers"]);
  const isSystem = pickBool(o, ["isSystem", "is_system", "system", "isDefault", "is_default"]);
  return { id, name, description, icon, memberCount, isSystem };
}

function normalizeRoleDetail(raw: unknown): AdminRoleDetail | null {
  const o = asRecord(raw);
  if (!o) return null;
  const base = normalizeRoleListItem(o);
  if (!base) return null;
  const keysRaw =
    o.permissionKeys ??
    o.permission_keys ??
    o.permissions ??
    o.assignedPermissions ??
    o.assigned_permissions;
  let permissionKeys = extractPermissionKeys(keysRaw);
  if (permissionKeys.length === 0 && Array.isArray(keysRaw)) {
    permissionKeys = extractPermissionKeys(
      keysRaw.map((p) => (asRecord(p) ? pickStr(asRecord(p)!, ["key", "permissionKey"]) : "")),
    );
  }
  return { ...base, permissionKeys };
}

function normalizeMemberPreview(raw: unknown): AdminRoleMemberPreview | null {
  const o = asRecord(raw);
  if (!o) return null;
  const id = pickStr(o, ["id", "adminId", "userId", "uuid"]);
  if (!id) return null;
  const firstName = pickStr(o, ["firstName", "first_name"]);
  const lastName = pickStr(o, ["lastName", "last_name"]);
  const fullFromParts = [firstName, lastName].filter(Boolean).join(" ").trim();
  const name =
    fullFromParts || pickStr(o, ["fullName", "full_name", "name", "displayName"]) || pickStr(o, ["email"]) || id;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return { id, name, initials: initials || "?" };
}

function unwrapEntity(data: unknown): unknown {
  const r = asRecord(data);
  if (!r) return data;
  return r.data ?? r.role ?? r.item ?? r.result ?? data;
}

/** `GET /admin/permissions` — permissions grouped by module. */
export async function getAdminPermissionsCatalog(): Promise<AdminPermissionModule[]> {
  const data = await adminRequest<unknown>("/admin/permissions", { method: "GET" });
  const modules = extractArray(data)
    .map(normalizePermissionModule)
    .filter((x): x is AdminPermissionModule => x !== null);
  if (modules.length > 0) return modules;

  const flat = extractArray(data)
    .map(normalizePermissionItem)
    .filter((x): x is AdminPermissionItem => x !== null);
  if (flat.length > 0) return [{ module: "Permissions", permissions: flat }];
  return [];
}

/** `GET /admin/roles` — list all admin roles (team invite dropdown uses slim shape). */
export async function getAdminRoles(): Promise<AdminRole[]> {
  const items = await getAdminRolesList();
  return items.map((r) => ({ id: r.id, name: r.name, description: r.description }));
}

/** `GET /admin/roles` — full list for Roles & Permission tab. */
export async function getAdminRolesList(): Promise<AdminRoleListItem[]> {
  const data = await adminRequest<unknown>("/admin/roles", { method: "GET" });
  return extractArray(data)
    .map(normalizeRoleListItem)
    .filter((x): x is AdminRoleListItem => x !== null);
}

/** `GET /admin/roles/{id}` — role detail with permission keys. */
export async function getAdminRoleDetail(id: string): Promise<AdminRoleDetail | null> {
  const data = await adminRequest<unknown>(`/admin/roles/${encodeURIComponent(id)}`, { method: "GET" });
  const inner = unwrapEntity(data);
  return normalizeRoleDetail(inner);
}

/** `GET /admin/roles/{id}/permissions` — assigned permission keys. */
export async function getAdminRolePermissionKeys(id: string): Promise<string[]> {
  const data = await adminRequest<unknown>(
    `/admin/roles/${encodeURIComponent(id)}/permissions`,
    { method: "GET" },
  );
  const inner = unwrapEntity(data);
  const r = asRecord(inner);
  if (r) {
    const keys = extractPermissionKeys(
      r.permissionKeys ?? r.permission_keys ?? r.permissions ?? r.keys ?? r.items,
    );
    if (keys.length > 0) return keys;
  }
  return extractPermissionKeys(inner);
}

/** `GET /admin/roles/{id}/members` — members assigned to this role. */
export async function getAdminRoleMembers(id: string): Promise<AdminRoleMemberPreview[]> {
  const data = await adminRequest<unknown>(`/admin/roles/${encodeURIComponent(id)}/members`, {
    method: "GET",
  });
  return extractArray(unwrapEntity(data))
    .map(normalizeMemberPreview)
    .filter((x): x is AdminRoleMemberPreview => x !== null);
}

/** `POST /admin/roles` — create role. */
export async function postAdminRole(body: AdminRoleUpsertBody): Promise<AdminRoleDetail | null> {
  const data = await adminRequest<unknown>("/admin/roles", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
  return normalizeRoleDetail(unwrapEntity(data));
}

/** `PUT /admin/roles/{id}` — update role. */
export async function putAdminRole(id: string, body: AdminRoleUpsertBody): Promise<AdminRoleDetail | null> {
  const data = await adminRequest<unknown>(`/admin/roles/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
    auth: true,
  });
  return normalizeRoleDetail(unwrapEntity(data));
}

/** `DELETE /admin/roles/{id}` — delete role. */
export async function deleteAdminRole(id: string): Promise<void> {
  await adminRequest(`/admin/roles/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}
