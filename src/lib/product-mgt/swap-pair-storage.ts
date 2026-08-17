import type { SwapPairFormValues } from "@/lib/product-mgt/rate-preview";

export type CreateSwapPairDraft = SwapPairFormValues & {
  baseCode: string;
  baseName: string;
  quoteCode: string;
  quoteName: string;
};

