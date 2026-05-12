"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";

/** Legacy `/onboarding` route: admin signup uses the email invitation link (`/accept-invitation`), not this page. */
export function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 lg:p-8">
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
          <div className="mx-auto w-full max-w-[470px] rounded-md bg-white px-8 py-9">
            <h1 className="text-primary-text text-[32px] font-semibold leading-tight">Admin access</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              New admins complete setup through the <strong>invitation email</strong> from your super admin. Open the
              &quot;Accept invitation&quot; link, then set your password on the{" "}
              <Link href="/accept-invitation" className="font-semibold text-secondary-green underline">
                accept invitation
              </Link>{" "}
              page (your link already includes a token).
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              Already have an account?{" "}
              <button type="button" className="font-semibold text-secondary-green underline" onClick={() => router.push("/login")}>
                Sign in
              </button>
            </p>
            <div className="mt-8">
              <Button type="button" fullWidth onClick={() => router.push("/login")}>
                Go to login
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default OnboardingPage;
