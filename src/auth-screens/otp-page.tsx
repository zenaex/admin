"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Timer1 } from "iconsax-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { OtpField } from "@/components/otp-field";
import { AdminApiError } from "@/lib/admin-api/client";
import { postAdminResendOtp } from "@/lib/admin-api/auth-api";
import { useAuth } from "@/lib/auth/auth-context";

export function OtpPage() {
  const router = useRouter();
  const { verifyOtp, pendingOtpEmail, ready, isAuthenticated } = useAuth();
  const [otpCode, setOtpCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeftSec, setTimeLeftSec] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const digits = otpCode.replace(/\D/g, "");
  const isOtpDisabled = digits.length < 6 || submitting;
  const timerLabel = useMemo(() => {
    const mm = Math.floor(timeLeftSec / 60);
    const ss = timeLeftSec % 60;
    return `${mm}:${String(ss).padStart(2, "0")}`;
  }, [timeLeftSec]);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }
    if (!pendingOtpEmail) router.replace("/login");
  }, [ready, isAuthenticated, pendingOtpEmail, router]);

  useEffect(() => {
    if (!ready || !pendingOtpEmail) return;
    setTimeLeftSec(120);
  }, [ready, pendingOtpEmail]);

  useEffect(() => {
    if (timeLeftSec <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeftSec((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeftSec]);

  const handleOtpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isOtpDisabled) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await verifyOtp(digits);
      router.replace("/dashboard");
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingOtpEmail || resending) return;
    setError(null);
    setNotice(null);
    setResending(true);
    try {
      await postAdminResendOtp({ email: pendingOtpEmail });
      setOtpCode("");
      setTimeLeftSec(120);
      setNotice("A new verification code has been sent.");
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "Could not resend code.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <main className="w-full max-w-[859px] h-[550px] rounded-2xl bg-white px-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] sm:px-10 flex items-center justify-center">
        <div className="mx-auto w-full max-w-[360px] text-center">
          <h1 className="text-primary-text text-[24px] font-semibold">
            OTP Verification Code
          </h1>
          <p className="mt-2 text-[16px] text-text-body">
            Enter the code sent to your email
            {pendingOtpEmail ? (
              <span className="mt-1 block text-sm font-medium text-primary-text">{pendingOtpEmail}</span>
            ) : null}
          </p>

          <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
                {notice}
              </p>
            ) : null}
            <OtpField value={otpCode} onChange={setOtpCode} />

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[14px] text-text-grey">
                <Timer1 size="24" color="currentColor" variant="Outline" />
                {timeLeftSec > 0
                  ? `Expires in ${timerLabel}`
                  : "Code expired. You can still try submit or resend a new code."}
              </span>
              <span className="text-text-secondary text-[16px]">
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResend}
                  className="font-semibold text-[16px] text-secondary-green disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resending ? "Resending…" : "Resend"}
                </button>
              </span>
            </div>

            <div className="pt-4">
              <Button
                
                type="submit"
                fullWidth
                disabled={isOtpDisabled}
                className={
                  isOtpDisabled
                    ? "bg-primary-green/45 w-full h-[48px] text-primary-text/55 hover:opacity-100"
                    : "w-full h-[48px]"
                }
              >
                {submitting ? "Verifying…" : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default OtpPage;
