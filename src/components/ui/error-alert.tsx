"use client";

import { useRouter } from "next/navigation";
import { clearAuthStorage } from "@/lib/auth/token-storage";

type ErrorAlertProps = {
  error: string | null;
  onRetry: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function ErrorAlert({ error, onRetry, className = "mt-4", children }: ErrorAlertProps) {
  const router = useRouter();
  if (!error) return null;

  const isUnauthorized =
    error.toLowerCase().includes("unauthorized") ||
    error.toLowerCase().includes("401") ||
    error.toLowerCase().includes("unauthenticated");

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
      {error}{" "}
      <button type="button" className="font-semibold underline hover:opacity-90" onClick={handleAction}>
        {isUnauthorized ? "Login" : "Retry"}
      </button>
      {children}
    </p>
  );
}
