import { Suspense } from "react";

import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
