"use client";

import { FormEvent, useState } from "react";
import { Timer1 } from "iconsax-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/button";
import { OtpField } from "@/components/otp-field";

export function OtpPage() {
  const router = useRouter();
  const [otpCode, setOtpCode] = useState("");
  const isOtpDisabled = otpCode.trim() === "";

  const handleOtpSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isOtpDisabled) return;
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <main className="w-full max-w-[859px] h-[550px] rounded-2xl bg-white px-6 shadow-[0_30px_80px_rgba(0,0,0,0.08)] sm:px-10 flex items-center justify-center">
        <div className="mx-auto w-full max-w-[360px] text-center">
          <h1 className="text-primary-text text-[24px] font-semibold">
            OTP Verification Code
          </h1>
          <p className="mt-2 text-[16px] text-[#777F89]">
            Enter the code sent to your email
          </p>

          <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
            <OtpField value={otpCode} onChange={setOtpCode} />

            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[14px] text-[#667085]">
                <Timer1 size="12" color="currentColor" variant="Outline" />
                Expires in 0:13
              </span>
              <span className="text-[#6B6B6B] text-[16px]">
                Didn&apos;t get a code?{" "}
                <button type="button" className="font-semibold text-[16px] text-secondary-green">
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
                    ? "bg-primary-green/45 w-[400px] h-[48px] text-primary-text/55 hover:opacity-100"
                    : "w-[400px] h-[48px]"
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

export default OtpPage;
