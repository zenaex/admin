"use client";

import {
  formatMarkupRateDisplay,
  formatMarkupTypeLabel,
  type MarkupFormValues,
} from "@/lib/product-mgt/rate-preview";

type SellCryptoRateConfirmSummaryProps = {
  form: MarkupFormValues;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-primary-text">{value}</span>
    </div>
  );
}

export function SellCryptoRateConfirmSummary({ form }: SellCryptoRateConfirmSummaryProps) {
  return (
    <div className="rounded-2xl bg-surface-subtle px-4 py-1">
      <SummaryRow label="Markup Type" value={formatMarkupTypeLabel(form.markupType)} />
      <SummaryRow
        label="Our Markup Rate"
        value={formatMarkupRateDisplay(form.markupType, form.markupRate)}
      />
    </div>
  );
}
