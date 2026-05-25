import { Suspense } from "react";
import { CreateSwapPairView } from "@/components/product-mgt/create-swap-pair-view";

export default function CreateSwapPairPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
      <CreateSwapPairView />
    </Suspense>
  );
}
