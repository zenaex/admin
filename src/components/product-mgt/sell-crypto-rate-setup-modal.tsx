"use client";

import { useEffect, useState } from "react";
import { ArrowSwapHorizontal, CloseCircle } from "iconsax-react";
import { CryptoCurrencyCell } from "@/components/product-mgt/crypto-currency-cell";
import { CountryFlag } from "@/components/ui/country-flag";
import type { ExchangeRateRow } from "@/components/product-mgt/product-mgt-types";
import {
  getNgnBase,
  markupRateInputValue,
  parseMarkupFormFromRow,
  type MarkupFormValues,
  type MarkupType,
} from "@/lib/product-mgt/rate-preview";

const MARKUP_TYPES = ["Flat", "Percentage", "% capped @"] as const;
const PAIR_ICON_SIZE = 34;

type SellCryptoRateSetupModalProps = {
  row: ExchangeRateRow;
  onClose: () => void;
  onSubmit: (values: MarkupFormValues) => void;
};

export function SellCryptoRateSetupModal({ row, onClose, onSubmit }: SellCryptoRateSetupModalProps) {
  const ngn = getNgnBase();
  const [swapped, setSwapped] = useState(false);
  const [form, setForm] = useState<MarkupFormValues>(() => parseMarkupFormFromRow(row));

  useEffect(() => {
    setForm(parseMarkupFormFromRow(row));
    setSwapped(false);
  }, [row.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const crypto = { code: row.currencyCode, name: row.currencyName };
  const isLeftCrypto = !swapped;

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
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface-subtle px-3 py-2.5">
            {isLeftCrypto ? (
              <CryptoCurrencyCell
                currencyCode={crypto.code}
                currencyName={crypto.name}
                size={PAIR_ICON_SIZE}
              />
            ) : (
              <>
                <CountryFlag code={ngn.countryCode} size={PAIR_ICON_SIZE} shape="round" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary-text">{ngn.code}</p>
                  <p className="truncate text-xs text-zinc-500">{ngn.name}</p>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSwapped((s) => !s)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-outline text-zinc-500 transition-colors hover:bg-zinc-200"
            aria-label="Swap currencies"
          >
            <ArrowSwapHorizontal size={18} variant="Outline" color="currentColor" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface-subtle px-3 py-2.5">
            {!isLeftCrypto ? (
              <CryptoCurrencyCell
                currencyCode={crypto.code}
                currencyName={crypto.name}
                size={PAIR_ICON_SIZE}
              />
            ) : (
              <>
                <CountryFlag code={ngn.countryCode} size={PAIR_ICON_SIZE} shape="round" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary-text">{ngn.code}</p>
                  <p className="truncate text-xs text-zinc-500">{ngn.name}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Markup Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.markupType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    markupType: e.target.value as MarkupType,
                    markupRate: markupRateInputValue(
                      e.target.value as MarkupType,
                      f.markupRate,
                    ),
                  }))
                }
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
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Markup Rate</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={markupRateInputValue(form.markupType, form.markupRate)}
              onChange={(e) => setForm((f) => ({ ...f, markupRate: e.target.value }))}
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
