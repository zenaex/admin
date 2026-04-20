import { Suspense } from "react";

import { EtradeView } from "@/components/e-trades/etrade-view";

export default function ETradesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
      <EtradeView />
    </Suspense>
  );
}
