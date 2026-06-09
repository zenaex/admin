"use client";

import { useRouter } from "next/navigation";
import { AdminApiError, formatAdminApiError } from "@/lib/admin-api/client";
import { clearAuthStorage } from "@/lib/auth/token-storage";

type ErrorAlertProps = {
  error: string | null | unknown;
  onRetry: () => void;
  className?: string;
  children?: React.ReactNode;
};

function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof AdminApiError && error.status === 401) return true;
  const message = formatAdminApiError(error, "").toLowerCase();
  return (
    message.includes("unauthorized") ||
    message.includes("401") ||
    message.includes("unauthenticated")
  );
}

export function ErrorAlert({ error, onRetry, className = "mt-4", children }: ErrorAlertProps) {
  const router = useRouter();
  if (error == null || error === "") return null;

  const message = formatAdminApiError(error);
  const isUnauthorized = isUnauthorizedError(error);

  const handleAction = () => {
    if (isUnauthorized) {
      clearAuthStorage();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      } else {
        router.push("/login");
      }
    } else {
      onRetry();
    }
  };

  return (
    <p className={`${className} rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700`} role="alert">
      {message}{" "}
      <button type="button" className="font-semibold underline hover:opacity-90" onClick={handleAction}>
        {isUnauthorized ? "Login" : "Retry"}
      </button>
      {children}
    </p>
  );
}
