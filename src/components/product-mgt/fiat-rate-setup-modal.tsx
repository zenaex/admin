"use client";

import { useEffect, useState } from "react";
import { ArrowSwapHorizontal, CloseCircle } from "iconsax-react";
import { CountryFlag } from "@/components/ui/country-flag";
import type { ExchangeRateRow } from "@/components/product-mgt/product-mgt-types";
import { getNgnBase, parseFormFromRow, type RateFormValues } from "@/lib/product-mgt/rate-preview";
import { resolveCountryCode } from "@/lib/country/resolve-country-code";
import { getAdminLiveBaseRate } from "@/lib/admin-api/exchange-rates-api";

const MARKUP_TYPES = ["Flat", "Percentage", "% capped @"] as const;

type FiatRateSetupModalProps = {
  row: ExchangeRateRow;
  onClose: () => void;
  onSubmit: (values: RateFormValues) => void;
};

export function FiatRateSetupModal({ row, onClose, onSubmit }: FiatRateSetupModalProps) {
  const ngn = getNgnBase();
  const targetIso = row.countryCode ?? resolveCountryCode(row.currencyCode, row.currencyName);

  const [swapped, setSwapped] = useState(false);
  const [form, setForm] = useState<RateFormValues>(() => parseFormFromRow(row));

  useEffect(() => {
    setForm(parseFormFromRow(row));
    setSwapped(false);

    // Fetch live base rate from FX provider
    getAdminLiveBaseRate(row.currencyCode, "NGN")
      .then((liveRate) => {
        if (liveRate > 0) {
          setForm((f) => ({ ...f, baseRate: String(liveRate) }));
        }
      })
      .catch((err) => console.error("Error loading live base rate:", err));
  }, [row.id, row.currencyCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const left = swapped
    ? { code: row.currencyCode, name: row.currencyName, iso: targetIso }
    : { code: ngn.code, name: ngn.name, iso: ngn.countryCode };
  const right = swapped
    ? { code: ngn.code, name: ngn.name, iso: ngn.countryCode }
    : { code: row.currencyCode, name: row.currencyName, iso: targetIso };

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
            <CountryFlag code={left.iso} size={28} shape="round" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary-text">{left.code}</p>
              <p className="truncate text-xs text-zinc-500">{left.name}</p>
            </div>
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
            <CountryFlag code={right.iso} size={28} shape="round" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-primary-text">{right.code}</p>
              <p className="truncate text-xs text-zinc-500">{right.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Base Rate</label>
            <input
              type="text"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
              value={form.baseRate}
              onChange={(e) => setForm((f) => ({ ...f, baseRate: e.target.value }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-text">Markup Type</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                value={form.markupType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    markupType: e.target.value as RateFormValues["markupType"],
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
              value={form.markupRate}
              onChange={(e) => setForm((f) => ({ ...f, markupRate: e.target.value }))}
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
