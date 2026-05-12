"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { ArrowLeft } from "iconsax-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { postAdminForgotPassword } from "@/lib/admin-api/auth-api";
import { AdminApiError } from "@/lib/admin-api/client";

export function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isEmailEmpty = email.trim() === "";

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmailEmpty) return;
    setError(null);
    setSubmitting(true);
    try {
      await postAdminForgotPassword({ email: email.trim() });
      setDone(true);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Request failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 lg:p-8">
      <main className="grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(420px,520px)_1fr] lg:gap-12">
        <section className="relative mx-auto aspect-[649/846] w-full max-w-[520px] overflow-hidden rounded-2xl">
          <Image
            src="/onboarding/onboardingPIC.png"
            alt="Onboarding visual"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute inset-0 bg-black/12" />

          <div className="absolute left-5 top-5">
            <Image src="/logo/logo-white.svg" alt="Zenaex logo" width={120} height={24} />
          </div>

          <div className="absolute inset-x-6 bottom-6 rounded-3xl border border-white/45 bg-white/10 p-6 text-white backdrop-blur-[2px]">
            <h2 className="text-[34px] font-semibold leading-[1.02] tracking-[-0.01em]">
              <span className="block whitespace-nowrap">Pay, Spend, and Move</span>
              <span className="block">Money Easily</span>
            </h2>
            <p className="mt-4 text-sm text-white/90">
              Instant transactions, secure wallets, and reliable payouts.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-[760px] rounded-2xl bg-background px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-[470px] rounded-md bg-white px-8 py-9">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mb-5 inline-flex items-center text-zinc-500"
                aria-label="Back to login"
              >
                <ArrowLeft size="16" color="currentColor" variant="Outline" />
              </button>

              <h1 className="text-primary-text text-[40px] font-semibold leading-[0.98] tracking-[-0.01em]">
                Forget Password?
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                {done
                  ? "If an account exists for this email, a reset request was sent. A super admin must approve it before you receive a reset link."
                  : "Enter your registered email address. A super admin will be notified to approve your reset request."}
              </p>

              {!done ? (
                <form onSubmit={handleRequestSubmit} className="mt-8 space-y-5">
                  {error ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                      {error}
                    </p>
                  ) : null}
                  <InputField
                    id="forgot-email"
                    name="forgot-email"
                    label="Email Address"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <p className="text-xs text-zinc-500">
                    Already have an approval link?{" "}
                    <Link href="/reset-password" className="font-semibold text-secondary-green underline">
                      Reset password
                    </Link>
                  </p>
                  <div className="pt-3">
                    <Button
                      type="submit"
                      fullWidth
                      disabled={isEmailEmpty || submitting}
                      className={
                        isEmailEmpty || submitting
                          ? "bg-primary-green/45 text-primary-text/55 hover:opacity-100"
                          : ""
                      }
                    >
                      {submitting ? "Submitting…" : "Continue"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-8 space-y-4">
                  <Button type="button" fullWidth onClick={() => router.push("/login")}>
                    Back to login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
