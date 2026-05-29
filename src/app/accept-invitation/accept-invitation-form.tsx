"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeSlash } from "iconsax-react";

import { getInvitationValidate, postInvitationAccept } from "@/lib/admin-api/auth-api";
import { AdminApiError } from "@/lib/admin-api/client";
import { useAuth } from "@/lib/auth/auth-context";

function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-zinc-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-4 pr-12 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-0 top-0 inline-flex h-12 w-12 items-center justify-center text-zinc-400 hover:text-zinc-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeSlash size="18" variant="Outline" color="currentColor" />
          ) : (
            <Eye size="18" variant="Outline" color="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}

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

  const isMinLengthMet = password.length >= 8;
  const isNumberMet = /\d/.test(password);
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;
  const canSubmit = valid && isMinLengthMet && isNumberMet && passwordsMatch && !submitting;

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

  const getBarColor = (index: number) => {
    if (!password) return "bg-zinc-100";
    
    // Strong state: both criteria met and passwords match
    if (isMinLengthMet && isNumberMet && passwordsMatch) {
      return "bg-[#008A22]"; // strong green
    }
    
    const metCount = (isMinLengthMet ? 1 : 0) + (isNumberMet ? 1 : 0);
    
    if (metCount === 2) {
      return index < 2 ? "bg-orange-500" : "bg-zinc-100";
    }
    
    if (metCount === 1) {
      return index < 2 ? "bg-orange-500" : "bg-zinc-100";
    }
    
    return index === 0 ? "bg-red-500" : "bg-zinc-100";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] p-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600 mx-auto"></div>
          <p className="mt-3 text-sm text-zinc-500 font-medium">Checking invitation…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFC] px-4 py-8 md:py-12">
      <div className="flex w-full max-w-[960px] flex-col gap-6 md:flex-row md:items-stretch md:justify-between">
        
        {/* Left Side: Onboarding Image Card */}
        <div className="relative hidden w-full md:flex md:w-[48%] overflow-hidden rounded-[32px] bg-zinc-950 min-h-[580px] shadow-sm">
          <img
            src="/onboarding/onboardingPIC.png"
            alt="Zenaex Onboarding"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
          
          {/* Logo at top-left */}
          <div className="absolute left-8 top-8">
            <img src="/logo/logo-white.svg" alt="Zenaex" className="h-6 w-auto" />
          </div>

          {/* Glassmorphic overlay card at bottom */}
          <div className="absolute bottom-6 left-6 right-6 rounded-[24px] border border-white/10 bg-white/[0.08] p-6 backdrop-blur-md">
            <h2 className="text-[22px] font-bold leading-snug text-white">
              Pay, Spend, and Move Money Easily
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">
              Instant transactions, secure wallets, and reliable payouts.
            </p>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="flex w-full flex-col justify-center rounded-[32px] bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] border border-zinc-100/50 md:w-[48%] md:p-10">
          
          {/* Mobile-only logo */}
          <div className="mb-6 md:hidden">
            <img src="/logo/logo-green.svg" alt="Zenaex" className="h-6 w-auto" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Create Password</h1>
          <p className="mt-1 text-[13px] text-zinc-400">Create a password for your account.</p>

          {error && !valid ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          ) : null}

          {valid ? (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              ) : null}

              <PasswordInput
                id="invite-pw"
                label="New Password"
                placeholder="Enter new password"
                value={password}
                onChange={setPassword}
              />

              <PasswordInput
                id="invite-pw2"
                label="Confirm Password"
                placeholder="Confirm password"
                value={confirm}
                onChange={setConfirm}
              />

              {/* Password Strength Meter */}
              <div className="flex gap-2 py-1">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`h-[4px] flex-1 rounded-full transition-colors duration-300 ${getBarColor(idx)}`}
                  />
                ))}
              </div>

              {/* Checklist */}
              <div className="mt-1 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-[13px]">
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                    isMinLengthMet ? 'border-[#008A22] bg-[#008A22] text-white' : 'border-zinc-300 bg-white'
                  }`}>
                    {isMinLengthMet && (
                      <svg className="h-2.5 w-2.5 stroke-white stroke-[3.5] fill-none" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={isMinLengthMet ? 'text-zinc-800 font-medium' : 'text-zinc-500'}>
                    Must contain a minimum of 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[13px]">
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                    isNumberMet ? 'border-[#008A22] bg-[#008A22] text-white' : 'border-zinc-300 bg-white'
                  }`}>
                    {isNumberMet && (
                      <svg className="h-2.5 w-2.5 stroke-white stroke-[3.5] fill-none" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={isNumberMet ? 'text-zinc-800 font-medium' : 'text-zinc-500'}>
                    Must contain at least one number
                  </span>
                </div>
              </div>

              {/* Submit / Login Button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className={`mt-4 w-full rounded-full py-3.5 text-sm font-semibold transition-all duration-200 ${
                  canSubmit
                    ? 'bg-[#C1FF00] text-black hover:opacity-90 active:scale-[0.98]'
                    : 'bg-[#C1FF00]/40 text-zinc-400/80 cursor-not-allowed'
                }`}
              >
                {submitting ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
