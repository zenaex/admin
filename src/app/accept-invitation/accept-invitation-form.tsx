"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { PasswordField } from "@/components/password-field";
import { getInvitationValidate, postInvitationAccept } from "@/lib/admin-api/auth-api";
import { AdminApiError } from "@/lib/admin-api/client";
import { useAuth } from "@/lib/auth/auth-context";

export function AcceptInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { applyTokenPair, isAuthenticated, ready } = useAuth();
  const rawToken = searchParams?.get("token")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!rawToken) {
        setLoading(false);
        setValid(false);
        setError("Missing invitation token.");
        return;
      }
      try {
        const res = await getInvitationValidate(rawToken);
        if (cancelled) return;
        if (!res.valid) {
          setValid(false);
          setError("This invitation link is invalid or has expired.");
          return;
        }
        setValid(true);
        setEmail(res.email ?? "");
        setFirstName(res.firstName ?? "");
        setLastName(res.lastName ?? "");
        setRole(res.role ?? "");
      } catch (e) {
        if (cancelled) return;
        setValid(false);
        setError(e instanceof AdminApiError ? e.message : "Could not validate invitation.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rawToken]);

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const canSubmit = valid && hasMinLength && hasNumber && passwordsMatch && !submitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || !rawToken) return;
    setError(null);
    setSubmitting(true);
    try {
      const pair = await postInvitationAccept({ token: rawToken, password });
      applyTokenPair(pair);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Could not complete signup.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <p className="text-sm text-zinc-500">Checking invitation…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <main className="w-full max-w-[480px] rounded-2xl border border-zinc-100 bg-white px-8 py-10 shadow-sm">
        <h1 className="text-2xl font-semibold text-primary-text">Accept invitation</h1>
        <p className="mt-2 text-sm text-zinc-500">Set your password to activate your admin account.</p>

        {error && !valid ? (
          <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {valid ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <InputField id="invite-email" name="email" label="Email" type="email" value={email} readOnly />
            <div className="grid grid-cols-2 gap-3">
              <InputField id="invite-fn" name="firstName" label="First name" value={firstName} readOnly />
              <InputField id="invite-ln" name="lastName" label="Last name" value={lastName} readOnly />
            </div>
            <InputField id="invite-role" name="role" label="Role" value={role} readOnly />
            <PasswordField id="invite-pw" label="Password" value={password} onChange={setPassword} />
            <PasswordField id="invite-pw2" label="Confirm password" value={confirm} onChange={setConfirm} />
            <Button type="submit" fullWidth disabled={!canSubmit} className="mt-2">
              {submitting ? "Creating account…" : "Activate account"}
            </Button>
          </form>
        ) : null}
      </main>
    </div>
  );
}
