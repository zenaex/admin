"use client";

import { buildRatePreview, type RateFormValues } from "@/lib/product-mgt/rate-preview";

type FiatRateConfirmSummaryProps = {
  form: RateFormValues;
  currencyCode: string;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-primary-text">{value}</span>
    </div>
  );
}

export function FiatRateConfirmSummary({ form, currencyCode }: FiatRateConfirmSummaryProps) {
  const preview = buildRatePreview(form, currencyCode);

  return (
    <div className="rounded-2xl bg-surface-subtle px-4 py-1">
      <SummaryRow label="Base Rate" value={preview.baseRateDisplay} />
      <SummaryRow label="Markup Type" value={preview.markupTypeLabel} />
      <SummaryRow label="Our Markup" value={preview.ourMarkupDisplay} />
      <div className="my-1 border-t border-dashed border-zinc-300" />
      <div className="flex items-center justify-between gap-4 py-2 text-sm">
        <span className="font-semibold text-primary-text">Final Rate</span>
        <span className="font-bold text-primary-text">{preview.finalRateDisplay}</span>
      </div>
    </div>
  );
}
