"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { PasswordField } from "@/components/password-field";
import { AdminApiError, getAdminApiBaseUrlSnapshot } from "@/lib/admin-api/client";
import { useAuth } from "@/lib/auth/auth-context";

function formatLoginApiError(e: unknown): string {
  if (!(e instanceof AdminApiError)) return "Something went wrong. Please try again.";
  
  if (e.status === 401) {
    return e.message || "Invalid credentials. Please check your email and password.";
  }
  if (e.status === 403) {
    return "Access denied. Your account does not have permission to access this area.";
  }
  if (e.status === 404) {
    return "The login service is temporarily unavailable. Please try again later.";
  }
  if (e.status === 0) {
    return "Unable to connect to the server. Please check your internet connection and try again.";
  }
  
  return e.message || "Something went wrong. Please try again.";
}

export function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, ready } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoginDisabled = email.trim() === "" || password.trim() === "" || submitting;

  useEffect(() => {
    if (ready && isAuthenticated) router.replace("/dashboard");
  }, [ready, isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoginDisabled) return;
    setError(null);
    setSubmitting(true);
    try {
      const next = await login(email, password);
      if (next === "otp") router.push("/login/otp");
      else router.replace("/dashboard");
    } catch (e) {
      setError(formatLoginApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 lg:p-8">
      <main className="grid w-full max-w-[1280px] grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(420px,520px)_1fr] lg:gap-12">
        <section className="relative mx-auto aspect-[649/846] w-full max-w-[649px] overflow-hidden rounded-2xl">
          <Image
            src="/onboarding/onboardingPIC.png"
            alt="Onboarding visual"
            fill
            className="object-contain"
            priority
          />
          <div className="absolute inset-0 bg-black/12" />

          <div className="absolute left-[49px] top-[41px]">
            <Image
              src="/logo/logo-white.svg"
              alt="Zenaex logo"
              width={198.18}
              height={30}
            />
          </div>

          <div className="absolute inset-x-6 bottom-6 rounded-3xl border border-white/45 bg-white/10 p-6 text-white backdrop-blur-[2px]">
            <h2 className="text-[36px] font-semibold leading-[1.02] tracking-[-0.01em]">
              <span className="block whitespace-nowrap">Pay, Spend, and Move</span>
              <span className="block">Money Easily</span>
            </h2>
            <p className="mt-4 text-[16px] text-white/90">
              Instant transactions, secure wallets, and reliable payouts.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-[60px]">
          <div className="w-full max-w-[660px] h-[553] rounded-[20px] bg-background px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-[470px] rounded-md bg-white px-8 py-9">
              <h1 className="text-primary-text text-[30px] font-semibold leading-[0.98] tracking-[-0.01em]">
                Welcome back
              </h1>
              <p className="mt-2 text-[16px] text-zinc-500">
                Login to your admin dashboard
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-[14px]">
                {error ? (
                  <p
                    className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <InputField
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address"
                  className="text-[14px]"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <div>
                  <PasswordField
                    id="password"
                    label="Password"
                    className="text-[14px]"
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="text-[14px] font-medium text-secondary-green"
                    >
                      Forget Password
                    </button>
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isLoginDisabled}
                    className={
                      isLoginDisabled
                        ? "bg-primary-green/45 text-primary-text/55 hover:opacity-100 text-[16px]"
                        : "text-[16px]"
                    }
                  >
                    {submitting ? "Signing in…" : "Login"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LoginPage;
