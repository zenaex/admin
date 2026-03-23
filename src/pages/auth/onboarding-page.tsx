"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { CloseSquare, TickSquare } from "iconsax-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { PasswordField } from "@/components/password-field";

export function OnboardingPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const strengthState = useMemo(() => {
    if (!newPassword && !confirmPassword) return "empty";
    if (hasMinLength && hasNumber && passwordsMatch) return "valid";
    return "invalid";
  }, [confirmPassword, hasMinLength, hasNumber, newPassword, passwordsMatch]);

  const isSubmitDisabled = !(hasMinLength && hasNumber && passwordsMatch);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    router.push("/login");
  };

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
                Create Password
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Create a password for your account.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <PasswordField
                  id="new-password"
                  label="New Password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={setNewPassword}
                />

                <PasswordField
                  id="confirm-password"
                  label="Confirm Password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />

                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-3 gap-1.5">
                    <span
                      className={
                        strengthState === "valid"
                          ? "h-[3px] rounded-full bg-secondary-green"
                          : strengthState === "invalid"
                            ? "h-[3px] rounded-full bg-red-500"
                            : "h-[3px] rounded-full bg-zinc-200"
                      }
                    />
                    <span
                      className={
                        strengthState === "valid"
                          ? "h-[3px] rounded-full bg-secondary-green"
                          : strengthState === "invalid"
                            ? "h-[3px] rounded-full bg-zinc-200"
                            : "h-[3px] rounded-full bg-zinc-200"
                      }
                    />
                    <span
                      className={
                        strengthState === "valid"
                          ? "h-[3px] rounded-full bg-secondary-green"
                          : "h-[3px] rounded-full bg-zinc-200"
                      }
                    />
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      {hasMinLength ? (
                        <TickSquare size="12" color="#013220" variant="Bold" />
                      ) : (
                        <CloseSquare size="12" color="#9ca3af" variant="Linear" />
                      )}
                      Must contain a minimum of 8 characters
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      {hasNumber ? (
                        <TickSquare size="12" color="#013220" variant="Bold" />
                      ) : (
                        <CloseSquare size="12" color="#9ca3af" variant="Linear" />
                      )}
                      Must contain at least one number
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Button
                    type="submit"
                    fullWidth
                    disabled={isSubmitDisabled}
                    className={
                      isSubmitDisabled
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

export default OnboardingPage;
