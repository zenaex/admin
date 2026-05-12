/**
 * Admin auth HTTP calls. Paths are appended to `NEXT_PUBLIC_ADMIN_API_URL` (no trailing slash),
 * e.g. base `https://dev-api.zenaex.com/api` + `/admin/auth/login` → `.../api/admin/auth/login`.
 *
 * **Status semantics (confirm with your backend):**
 * - **403** often means wrong password or forbidden.
 * - **404** may mean wrong path/prefix **or** an intentional “not found” for disallowed accounts (anti-enumeration).
 */
import { adminRequest } from "@/lib/admin-api/client";
import type {
  AdminForgotPasswordBody,
  AdminInvitationAcceptBody,
  AdminInvitationCreateBody,
  AdminInvitationValidateResponse,
  AdminLoginBody,
  AdminLoginResponse,
  AdminPasswordResetApproveBody,
  AdminPasswordResetResetBody,
  AdminResendOtpBody,
  AdminTokenPair,
  AdminVerifyOtpBody,
} from "@/lib/admin-api/types";

export async function postAdminLogin(body: AdminLoginBody): Promise<AdminLoginResponse> {
  return adminRequest<AdminLoginResponse>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function postAdminVerifyOtp(body: AdminVerifyOtpBody): Promise<AdminTokenPair> {
  return adminRequest<AdminTokenPair>("/admin/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function postAdminResendOtp(body: AdminResendOtpBody): Promise<unknown> {
  return adminRequest("/admin/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function postAdminForgotPassword(body: AdminForgotPasswordBody): Promise<unknown> {
  return adminRequest("/admin/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function getInvitationValidate(token: string): Promise<AdminInvitationValidateResponse> {
  const q = new URLSearchParams({ token }).toString();
  return adminRequest<AdminInvitationValidateResponse>(`/admin/invitations/validate?${q}`, {
    method: "GET",
    auth: false,
  });
}

export async function postInvitationAccept(body: AdminInvitationAcceptBody): Promise<AdminTokenPair> {
  return adminRequest<AdminTokenPair>("/admin/invitations/accept", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}

export async function postInvitation(body: AdminInvitationCreateBody): Promise<unknown> {
  return adminRequest("/admin/invitations", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function postPasswordResetApprove(body: AdminPasswordResetApproveBody): Promise<unknown> {
  return adminRequest("/admin/password-reset/approve", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function postPasswordResetReset(body: AdminPasswordResetResetBody): Promise<unknown> {
  return adminRequest("/admin/password-reset/reset", {
    method: "POST",
    body: JSON.stringify(body),
    auth: false,
  });
}
