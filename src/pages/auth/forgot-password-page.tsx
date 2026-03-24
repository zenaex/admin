"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowLeft, CloseSquare, TickCircle, TickSquare } from "iconsax-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { PasswordField } from "@/components/password-field";

type ForgotStep = "request" | "requestModal" | "resetPassword" | "successModal";

export function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotStep>("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isEmailEmpty = email.trim() === "";
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch =
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;
  const canResetPassword = hasMinLength && hasNumber && passwordsMatch;

  const strengthState = useMemo(() => {
    if (!newPassword && !confirmPassword) return "empty";
    if (canResetPassword) return "valid";
    return "invalid";
  }, [canResetPassword, confirmPassword, newPassword]);

  const handleRequestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmailEmpty) return;
    setStep("requestModal");
  };

  const handleResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canResetPassword) return;
    setStep("successModal");
  };

  const showRequestModal = step === "requestModal";
  const showSuccessModal = step === "successModal";
  const isResetScreen = step === "resetPassword" || step === "successModal";

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
          <div className="w-full max-w-[760px] rounded-2xl bg-background px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto w-full max-w-[470px] rounded-md bg-[#FFFFFF] px-8 py-9">
              {!isResetScreen ? (
                <>
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
                    Enter your registered email address to reset
                  </p>

                  <form onSubmit={handleRequestSubmit} className="mt-8 space-y-5">
                    <InputField
                      id="forgot-email"
                      name="forgot-email"
                      label="Email Address"
                      type="email"
                      placeholder="Enter email address"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />

                    <div className="pt-3">
                      <Button
                        type="submit"
                        fullWidth
                        disabled={isEmailEmpty}
                        className={
                          isEmailEmpty
                            ? "bg-primary-green/45 text-primary-text/55 hover:opacity-100"
                            : ""
                        }
                      >
                        Continue
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h1 className="text-primary-text text-[40px] font-semibold leading-[0.98] tracking-[-0.01em]">
                    Reset Password
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    Enter your new desired password
                  </p>

                  <form onSubmit={handleResetSubmit} className="mt-8 space-y-5">
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

                      <div className="space-y-1.5">
                        <div className="flex w-full items-center gap-1.5 text-[11px] text-zinc-500">
                          {hasMinLength ? (
                            <TickSquare size="12" color="#013220" variant="Bold" />
                          ) : (
                            <CloseSquare size="12" color="#9ca3af" variant="Linear" />
                          )}
                          Must contain a minimum of 8 characters
                        </div>
                        <div className="flex w-full items-center gap-1.5 text-[11px] text-zinc-500">
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
                        disabled={!canResetPassword}
                        className={
                          !canResetPassword
                            ? "bg-primary-green/45 text-primary-text/55 hover:opacity-100"
                            : ""
                        }
                      >
                        Login
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {showRequestModal ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[520px] rounded-2xl bg-white px-8 py-10 text-center shadow-[0_24px_72px_rgba(0,0,0,0.12)]">
            <h2 className="text-primary-text text-[32px] font-semibold leading-tight">
              Reset Password
            </h2>
            <p className="mt-3 text-sm text-zinc-600">
              A password reset request has been sent to your admin. Kindly wait
              for approval.
            </p>
            <div className="mx-auto mt-8 w-full max-w-[300px]">
              <Button
                type="button"
                fullWidth
                onClick={() => setStep("resetPassword")}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showSuccessModal ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[620px] rounded-2xl bg-white px-8 py-10 text-center shadow-[0_24px_72px_rgba(0,0,0,0.12)]">
            <div className="mx-auto h-[2px] w-16 rounded-full bg-zinc-200" />
            <div className="mx-auto mt-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
              <TickCircle size="38" color="#2f8f46" variant="Linear" />
            </div>
            <h2 className="text-primary-text mt-6 text-[44px] font-semibold leading-none">
              Successful
            </h2>
            <p className="mt-4 text-sm text-zinc-600">
              Your password reset was successful.
            </p>
            <div className="mx-auto mt-8 w-full max-w-[300px]">
              <Button type="button" fullWidth onClick={() => router.push("/login")}>
                Proceed to Log In
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ForgotPasswordPage;
