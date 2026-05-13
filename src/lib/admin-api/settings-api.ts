import { adminRequest } from "@/lib/admin-api/client";
import { policyDtoToUi, uiStateToPolicyDto, type AdminPasswordPolicyUiState } from "@/lib/admin-api/settings-policy-map";
import type {
  AdminSettingsChangePasswordBody,
  AdminSettingsPasswordPolicyDto,
  AdminSettingsPasswordResetRequestRow,
  AdminSettingsProfile,
  AdminSettingsProfilePatchBody,
} from "@/lib/admin-api/types";

export async function getAdminSettingsProfile(): Promise<AdminSettingsProfile> {
  return adminRequest<AdminSettingsProfile>("/admin/settings/profile", { method: "GET" });
}

export async function patchAdminSettingsProfile(body: AdminSettingsProfilePatchBody): Promise<AdminSettingsProfile> {
  return adminRequest<AdminSettingsProfile>("/admin/settings/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function postAdminSettingsChangePassword(body: AdminSettingsChangePasswordBody): Promise<unknown> {
  return adminRequest("/admin/settings/change-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function pickString(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeResetRequestRow(r: unknown): AdminSettingsPasswordResetRequestRow | null {
  if (!r || typeof r !== "object") return null;
  const o = r as Record<string, unknown>;
  const requestId = pickString(o, ["requestId", "id", "request_id"]);
  if (!requestId) return null;
  const name = pickString(o, ["name", "fullName", "full_name", "adminName"]);
  const email = pickString(o, ["email", "emailAddress"]);
  const role = pickString(o, ["role", "adminRole", "admin_role"]);
  const dateRequested = pickString(o, [
    "dateRequested",
    "requestedAt",
    "requested_at",
    "createdAt",
    "created_at",
  ]);
  return { requestId, name: name || undefined, email: email || undefined, role: role || undefined, dateRequested: dateRequested || undefined };
}

export function normalizePasswordResetRequestsList(data: unknown): AdminSettingsPasswordResetRequestRow[] {
  const rawList = (() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const inner = d.requests ?? d.items ?? d.data ?? d.results;
      if (Array.isArray(inner)) return inner;
    }
    return [];
  })();

  return rawList.map(normalizeResetRequestRow).filter((x): x is AdminSettingsPasswordResetRequestRow => x !== null);
}

export async function getAdminSettingsPasswordResetRequests(): Promise<AdminSettingsPasswordResetRequestRow[]> {
  const data = await adminRequest<unknown>("/admin/settings/password-reset-requests", { method: "GET" });
  return normalizePasswordResetRequestsList(data);
}

export async function getAdminSettingsPasswordPolicy(): Promise<AdminSettingsPasswordPolicyDto> {
  return adminRequest<AdminSettingsPasswordPolicyDto>("/admin/settings/password-policy", { method: "GET" });
}

export async function patchAdminSettingsPasswordPolicy(
  body: AdminSettingsPasswordPolicyDto,
): Promise<AdminSettingsPasswordPolicyDto> {
  return adminRequest<AdminSettingsPasswordPolicyDto>("/admin/settings/password-policy", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function patchPasswordPolicyFromUiState(ui: AdminPasswordPolicyUiState): Promise<AdminPasswordPolicyUiState> {
  const dto = uiStateToPolicyDto(ui);
  const next = await patchAdminSettingsPasswordPolicy(dto);
  return policyDtoToUi(next);
}
