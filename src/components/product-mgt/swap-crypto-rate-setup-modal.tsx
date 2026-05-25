"use client";

import { useEffect, useState } from "react";
import { ArrowSwapHorizontal, CloseCircle } from "iconsax-react";
import { CryptoCurrencyCell } from "@/components/product-mgt/crypto-currency-cell";
import type { ExchangeRateRow, SwapPairMeta } from "@/components/product-mgt/product-mgt-types";
import {
  markupRateInputValue,
  parseSwapPairFormFromRow,
  type MarkupType,
  type SwapPairFormValues,
} from "@/lib/product-mgt/rate-preview";

const MARKUP_TYPES = ["Flat", "Percentage", "% capped @"] as const;
const PAIR_ICON_SIZE = 34;

type SwapCryptoRateSetupModalProps = {
  pair: SwapPairMeta;
  row: ExchangeRateRow;
  onClose: () => void;
  onSubmit: (values: SwapPairFormValues) => void;
};

export function SwapCryptoRateSetupModal({
  pair,
  row,
  onClose,
  onSubmit,
}: SwapCryptoRateSetupModalProps) {
  const [swapped, setSwapped] = useState(false);
  const [form, setForm] = useState<SwapPairFormValues>(() => parseSwapPairFormFromRow(row));

  useEffect(() => {
    setForm(parseSwapPairFormFromRow(row));
    setSwapped(false);
  }, [row.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const left = swapped
    ? { code: pair.quoteCode, name: pair.quoteName }
    : { code: pair.baseCode, name: pair.baseName };
  const right = swapped
    ? { code: pair.baseCode, name: pair.baseName }
    : { code: pair.quoteCode, name: pair.quoteName };

  const baseToQuoteLabel = `Markup Rate for 1 ${pair.baseCode} to ${pair.quoteCode}`;
  const quoteToBaseLabel = `Markup Rate for ${pair.quoteCode} to ${pair.baseCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white px-6 pb-7 pt-5 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-primary-text">Rate Setup</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600"
            aria-label="Close"
          >
            <CloseCircle size={22} variant="Outline" color="currentColor" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 rounded-xl bg-surface-subtle px-3 py-2.5">
            <CryptoCurrencyCell
              currencyCode={left.code}
              currencyName={left.name}
              size={PAIR_ICON_SIZE}
            />
          </div>
          <button
            type="button"
            onClick={() => setSwapped((s) => !s)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-outline text-zinc-500 transition-colors hover:bg-zinc-200"
            aria-label="Swap pair display"
          >
            <ArrowSwapHorizontal size={18} variant="Outline" color="currentColor" />
          </button>
          <div className="flex min-w-0 flex-1 rounded-xl bg-surface-subtle px-3 py-2.5">
            <CryptoCurrencyCell
              currencyCode={right.code}
              currencyName={right.name}
              size={PAIR_ICON_SIZE}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Markup Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.markupType}
                onChange={(e) => {
                  const markupType = e.target.value as MarkupType;
                  setForm((f) => ({
                    markupType,
                    baseToQuoteRate: markupRateInputValue(markupType, f.baseToQuoteRate),
                    quoteToBaseRate: markupRateInputValue(markupType, f.quoteToBaseRate),
                  }));
                }}
              >
                {MARKUP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 5l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">{baseToQuoteLabel}</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={markupRateInputValue(form.markupType, form.baseToQuoteRate)}
              onChange={(e) => setForm((f) => ({ ...f, baseToQuoteRate: e.target.value }))}
              placeholder={form.markupType === "Percentage" ? "e.g. 20%" : "e.g. 50"}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">{quoteToBaseLabel}</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={markupRateInputValue(form.markupType, form.quoteToBaseRate)}
              onChange={(e) => setForm((f) => ({ ...f, quoteToBaseRate: e.target.value }))}
              placeholder={form.markupType === "Percentage" ? "e.g. 20%" : "e.g. 50"}
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
