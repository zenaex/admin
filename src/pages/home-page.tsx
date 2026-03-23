"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { Clock } from "iconsax-react";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { OtpField } from "@/components/otp-field";
import { PasswordField } from "@/components/password-field";

export function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"login" | "otp" | "done">("login");
  const isLoginDisabled = email.trim() === "" || password.trim() === "";
  const isOtpDisabled = otpCode.trim() === "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoginDisabled) return;
    setStep("otp");
  };

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isOtpDisabled) return;
    setStep("done");
  };

  if (step === "otp") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4">
        <main className="w-full max-w-[700px] rounded-2xl bg-white px-6 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.08)] sm:px-10">
          <div className="mx-auto w-full max-w-[360px] text-center">
            <h1 className="text-primary-text text-[24px] font-semibold leading-tight">
              OTP Verification Code
            </h1>
            <p className="mt-2 text-xs text-zinc-500">
              Enter the code sent to your email
            </p>

            <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
              <OtpField value={otpCode} onChange={setOtpCode} />

              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1 text-zinc-500">
                  <Clock size="12" color="currentColor" variant="Outline" />
                  Expires in 0:13
                </span>
                <span className="text-zinc-500">
                  Didn&apos;t get a code?{" "}
                  <button type="button" className="font-semibold text-secondary-green">
                    Resend
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
                      ? "bg-primary-green/45 text-primary-text/55 hover:opacity-100"
                      : ""
                  }
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4">
        <main className="w-full max-w-[520px] rounded-2xl bg-white px-8 py-12 text-center shadow-[0_24px_72px_rgba(0,0,0,0.08)]">
          <h1 className="text-primary-text text-[28px] font-semibold">Welcome</h1>
          <p className="mt-3 text-sm text-zinc-600">
            Mock authentication completed successfully.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] p-4 lg:p-8">
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
            <Image
              src="/logo/logo-white.svg"
              alt="Zenaex logo"
              width={120}
              height={24}
            />
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
          <div className="w-full max-w-[760px] rounded-2xl bg-[#FAFAFA] px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-[470px] rounded-md bg-[#FFFFFF] px-8 py-9">
              <h1 className="text-primary-text text-[40px] font-semibold leading-[0.98] tracking-[-0.01em]">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Login to your admin dashboard
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <InputField
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <div>
                  <PasswordField
                    id="password"
                    label="Password"
                    value={password}
                    onChange={setPassword}
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="text-[11px] font-medium text-secondary-green"
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
                        ? "bg-primary-green/45 text-primary-text/55 hover:opacity-100"
                        : ""
                    }
                  >
                    Login
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
