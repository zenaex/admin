"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import type { CreateSwapPairDraft } from "@/lib/product-mgt/swap-pair-storage";
import {
  formatMarkupRateDisplay,
  formatMarkupTypeLabel,
} from "@/lib/product-mgt/rate-preview";
import { getCryptoIconUrl } from "@/lib/product-mgt/crypto-icons";

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 py-3 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="text-sm font-medium text-primary-text">{value}</span>
    </div>
  );
}

function CryptoValue({ code, name }: { code: string; name: string }) {
  const src = getCryptoIconUrl(code);
  return (
    <span className="inline-flex items-center gap-2">
      {src ? (
        <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded-full">
          <Image src={src} alt={code} width={24} height={24} className="object-cover" unoptimized />
        </span>
      ) : null}
      {name}
    </span>
  );
}

export function CreateSwapPairConfirmCard({ draft }: { draft: CreateSwapPairDraft }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-1">
      <SummaryRow label="Base Crypto" value={<CryptoValue code={draft.baseCode} name={draft.baseName} />} />
      <SummaryRow label="Quote Crypto" value={<CryptoValue code={draft.quoteCode} name={draft.quoteName} />} />
      <SummaryRow label="Markup Type" value={formatMarkupTypeLabel(draft.markupType)} />
      <SummaryRow
        label="Base to Quote Markup Rate"
        value={formatMarkupRateDisplay(draft.markupType, draft.baseToQuoteRate)}
      />
      <SummaryRow
        label="Quote to Base Markup Rate"
        value={formatMarkupRateDisplay(draft.markupType, draft.quoteToBaseRate)}
      />
    </div>
  );
}
