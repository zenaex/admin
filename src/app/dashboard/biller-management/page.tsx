import { redirect } from "next/navigation";

/** Stub route referenced by Next.js type validator; biller UI was removed from the app. */
export default function BillerManagementPage() {
  redirect("/dashboard");
}
