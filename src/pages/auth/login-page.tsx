"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { PasswordField } from "@/components/password-field";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const isLoginDisabled = email.trim() === "" || password.trim() === "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoginDisabled) return;
    router.push("/login/otp");
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
            <div className="mx-auto w-full max-w-[470px] rounded-md bg-[#FFFFFF] px-8 py-9">
              <h1 className="text-primary-text text-[30px] font-semibold leading-[0.98] tracking-[-0.01em]">
                Welcome back
              </h1>
              <p className="mt-2 text-[16px] text-zinc-500">
                Login to your admin dashboard
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-[14px]">
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

export default LoginPage;
