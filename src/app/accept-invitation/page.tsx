import { Suspense } from "react";

import { AcceptInvitationForm } from "@/app/accept-invitation/accept-invitation-form";

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <p className="text-sm text-zinc-500">Loading…</p>
        </div>
      }
    >
      <AcceptInvitationForm />
    </Suspense>
  );
}
