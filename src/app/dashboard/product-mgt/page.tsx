import { Suspense } from "react";

import { ProductMgtView } from "@/components/product-mgt/product-mgt-view";

export default function ProductMgtPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">Loading…</div>}>
      <ProductMgtView />
    </Suspense>
  );
}
