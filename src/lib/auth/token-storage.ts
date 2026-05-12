const ACCESS = "zenaex_admin_access_token";
const REFRESH = "zenaex_admin_refresh_token";
const PENDING_OTP_EMAIL = "zenaex_admin_pending_otp_email";

function safeGet(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function safeRemove(key: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getAccessToken(): string | null {
  return safeGet(ACCESS);
}

export function getRefreshToken(): string | null {
  return safeGet(REFRESH);
}

export function getPendingOtpEmail(): string | null {
  return safeGet(PENDING_OTP_EMAIL);
}

export function setTokens(accessToken: string, refreshToken: string) {
  safeSet(ACCESS, accessToken);
  safeSet(REFRESH, refreshToken);
}

export function setPendingOtpEmail(email: string) {
  safeSet(PENDING_OTP_EMAIL, email);
}

export function clearPendingOtpEmail() {
  safeRemove(PENDING_OTP_EMAIL);
}

export function clearTokens() {
  safeRemove(ACCESS);
  safeRemove(REFRESH);
}

export function clearAuthStorage() {
  clearTokens();
  clearPendingOtpEmail();
}
