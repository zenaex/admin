"use client";

import type { SwapPairMeta } from "@/components/product-mgt/product-mgt-types";
import {
  formatMarkupRateDisplay,
  formatMarkupTypeLabel,
  type SwapPairFormValues,
} from "@/lib/product-mgt/rate-preview";

type SwapCryptoRateConfirmSummaryProps = {
  pair: SwapPairMeta;
  form: SwapPairFormValues;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-primary-text">{value}</span>
    </div>
  );
}

function DirectionBlock({ title, markupTypeLabel, markupRate }: {
  title: string;
  markupTypeLabel: string;
  markupRate: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-500">{title}</p>
      <div className="rounded-2xl bg-surface-subtle px-4 py-1">
        <SummaryRow label="Markup Type" value={markupTypeLabel} />
        <SummaryRow label="Our Markup Rate" value={markupRate} />
      </div>
    </div>
  );
}

export function SwapCryptoRateConfirmSummary({ pair, form }: SwapCryptoRateConfirmSummaryProps) {
  const typeLabel = formatMarkupTypeLabel(form.markupType);

  return (
    <div className="space-y-4 text-left">
      <DirectionBlock
        title={`${pair.baseName} to ${pair.quoteName}`}
        markupTypeLabel={typeLabel}
        markupRate={formatMarkupRateDisplay(form.markupType, form.baseToQuoteRate)}
      />
      <DirectionBlock
        title={`${pair.quoteName} to ${pair.baseName}`}
        markupTypeLabel={typeLabel}
        markupRate={formatMarkupRateDisplay(form.markupType, form.quoteToBaseRate)}
      />
    </div>
  );
}
