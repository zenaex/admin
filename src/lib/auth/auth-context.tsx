"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { postAdminLogin, postAdminLogout, postAdminVerifyOtp } from "@/lib/admin-api/auth-api";
import type { AdminTokenPair } from "@/lib/admin-api/types";
import { tryRefreshSession } from "@/lib/admin-api/client";
import { adminProfileHintsFromToken } from "@/lib/auth/jwt";
import {
  clearAuthStorage,
  clearPendingOtpEmail,
  getAccessToken,
  getPendingOtpEmail,
  getRefreshToken,
  setPendingOtpEmail,
  setTokens,
} from "@/lib/auth/token-storage";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

type AuthContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  /** Email used for the OTP step (after password login). */
  pendingOtpEmail: string | null;
  displayEmail: string | null;
  /** Best-effort name from JWT (or email). */
  displayName: string | null;
  /** Role string from JWT for UI. */
  displayRole: string | null;
  /** Two-letter avatar hint from JWT name/email. */
  userInitials: string;
  login: (email: string, password: string) => Promise<"otp" | "dashboard">;
  verifyOtp: (otp: string) => Promise<void>;
  applyTokenPair: (pair: AdminTokenPair) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayEmail, setDisplayEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [displayRole, setDisplayRole] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("?");
  const [pendingOtpEmail, setPendingOtpEmailState] = useState<string | null>(null);

  const syncFromStorage = useCallback(() => {
    const access = getAccessToken();
    setIsAuthenticated(Boolean(access));
    const hints = adminProfileHintsFromToken(access);
    setDisplayEmail(hints.email);
    setDisplayName(hints.displayName);
    setDisplayRole(hints.roleLabel);
    setUserInitials(hints.initials);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!getAccessToken() && getRefreshToken()) {
          await tryRefreshSession();
        }
      } finally {
        if (!cancelled) {
          syncFromStorage();
          setPendingOtpEmailState(getPendingOtpEmail());
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [syncFromStorage]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await postAdminLogin({ email: email.trim(), password });
    const requiresOtp =
      res.requires_2fa === true ||
      // Some backends return success/message with empty tokens when OTP is required.
      (res.success === true && !res.accessToken && !res.refreshToken);
    if (requiresOtp) {
      const e = email.trim();
      setPendingOtpEmail(e);
      setPendingOtpEmailState(e);
      return "otp" as const;
    }
    if (res.accessToken && res.refreshToken) {
      setTokens(res.accessToken, res.refreshToken);
      syncFromStorage();
      return "dashboard" as const;
    }
    throw new Error("Unexpected login response");
  }, [syncFromStorage]);

  const verifyOtp = useCallback(async (otp: string) => {
    const email = getPendingOtpEmail();
    if (!email) throw new Error("Session expired. Please sign in again.");
    const digits = otp.replace(/\D/g, "");
    const pair = await postAdminVerifyOtp({ email, otp: digits });
    setTokens(pair.accessToken, pair.refreshToken);
    clearPendingOtpEmail();
    setPendingOtpEmailState(null);
    syncFromStorage();
  }, [syncFromStorage]);

  const applyTokenPair = useCallback(
    (pair: AdminTokenPair) => {
      setTokens(pair.accessToken, pair.refreshToken);
      clearPendingOtpEmail();
      setPendingOtpEmailState(null);
      syncFromStorage();
    },
    [syncFromStorage],
  );

  const logout = useCallback(async () => {
    try {
      await postAdminLogout();
    } catch (e) {
      console.error("Failed to call logout API:", e);
    } finally {
      clearAuthStorage();
      setIsAuthenticated(false);
      setDisplayEmail(null);
      setDisplayName(null);
      setDisplayRole(null);
      setUserInitials("?");
      setPendingOtpEmailState(null);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: NodeJS.Timeout;

    const handleLogout = async () => {
      await logout();
      router.push("/login");
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousemove", "keydown", "mousedown", "scroll", "touchstart"];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, logout, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      isAuthenticated,
      pendingOtpEmail,
      displayEmail,
      displayName,
      displayRole,
      userInitials,
      login,
      verifyOtp,
      applyTokenPair,
      logout,
    }),
    [
      applyTokenPair,
      displayEmail,
      displayName,
      displayRole,
      isAuthenticated,
      login,
      logout,
      pendingOtpEmail,
      ready,
      userInitials,
      verifyOtp,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
