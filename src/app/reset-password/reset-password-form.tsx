"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/button";
import { PasswordField } from "@/components/password-field";
import { postPasswordResetReset } from "@/lib/admin-api/auth-api";
import { AdminApiError } from "@/lib/admin-api/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const canSubmit = useMemo(
    () => Boolean(token) && hasMinLength && hasNumber && passwordsMatch && !submitting,
    [token, hasMinLength, hasNumber, passwordsMatch, submitting],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await postPasswordResetReset({ token, newPassword: password });
      setDone(true);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <main className="w-full max-w-[440px] rounded-2xl border border-zinc-100 bg-white px-8 py-10 text-center shadow-sm">
          <p className="text-sm text-zinc-600">Missing reset token. Open the link from your email.</p>
          <Button type="button" className="mt-6" fullWidth onClick={() => router.push("/login")}>
            Back to login
          </Button>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <main className="w-full max-w-[440px] rounded-2xl border border-zinc-100 bg-white px-8 py-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-primary-text">Password updated</h1>
          <p className="mt-2 text-sm text-zinc-500">You can sign in with your new password.</p>
          <Button type="button" className="mt-8" fullWidth onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <main className="w-full max-w-[440px] rounded-2xl border border-zinc-100 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-primary-text">Set new password</h1>
        <p className="mt-2 text-sm text-zinc-500">Choose a strong password for your admin account.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <PasswordField id="reset-pw" label="New password" value={password} onChange={setPassword} />
          <PasswordField id="reset-pw2" label="Confirm password" value={confirm} onChange={setConfirm} />
          <Button type="submit" fullWidth disabled={!canSubmit}>
            {submitting ? "Saving…" : "Update password"}
          </Button>
        </form>
      </main>
    </div>
  );
}
