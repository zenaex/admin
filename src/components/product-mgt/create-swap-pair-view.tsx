"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";
import { CreateSwapPairConfirmCard } from "@/components/product-mgt/create-swap-pair-confirm-card";
import { CreateSwapPairStepper } from "@/components/product-mgt/create-swap-pair-stepper";
import { CryptoSelectField } from "@/components/product-mgt/crypto-select-field";
import { findCryptoOption } from "@/lib/product-mgt/crypto-options";
import type { CryptoOption } from "@/lib/product-mgt/crypto-options";
import {
  appendExtraSwapPairRow,
  buildSwapPairRow,
  type CreateSwapPairDraft,
} from "@/lib/product-mgt/swap-pair-storage";
import {
  markupRateInputValue,
  type MarkupType,
} from "@/lib/product-mgt/rate-preview";
import { postCreateSwapPair } from "@/lib/admin-api/exchange-rates-api";

const MARKUP_TYPES = ["Flat", "Percentage", "% capped @"] as const;

type Step = "amount" | "confirm";

const DEFAULT_BASE = findCryptoOption("BTC")!;
const DEFAULT_QUOTE = findCryptoOption("ETH")!;

export function CreateSwapPairView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("amount");
  const [base, setBase] = useState<CryptoOption>(DEFAULT_BASE);
  const [quote, setQuote] = useState<CryptoOption>(DEFAULT_QUOTE);
  const [markupType, setMarkupType] = useState<MarkupType>("Percentage");
  const [baseToQuoteRate, setBaseToQuoteRate] = useState("20");
  const [quoteToBaseRate, setQuoteToBaseRate] = useState("20");

  const draft: CreateSwapPairDraft = {
    baseCode: base.code,
    baseName: base.name,
    quoteCode: quote.code,
    quoteName: quote.name,
    markupType,
    baseToQuoteRate,
    quoteToBaseRate,
  };

  const canContinue = base.code !== quote.code;

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) return;
    setStep("confirm");
  };

  const handleCreate = async () => {
    try {
      await postCreateSwapPair({
        baseCryptoSlug: draft.baseCode,
        quoteCryptoSlug: draft.quoteCode,
        baseToQuoteMarkupValue: parseFloat(draft.baseToQuoteRate) || 0,
        quoteToBaseMarkupValue: parseFloat(draft.quoteToBaseRate) || 0,
      });

      const row = buildSwapPairRow(draft);
      appendExtraSwapPairRow(row);
      router.push("/dashboard/product-mgt?tab=exchange-rates&ratesSubTab=swap-crypto");
    } catch (e) {
      console.error("Failed to create swap pair:", e);
      alert(e instanceof Error ? e.message : "Failed to create swap pair");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center rounded-xl border border-outline bg-white px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <Link
            href="/dashboard/product-mgt?tab=exchange-rates&ratesSubTab=swap-crypto"
            className="inline-flex items-center gap-1 text-primary-text hover:underline"
          >
            <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
            Product &amp; Rate Management
          </Link>
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
          <span className="text-primary-text">Create Swap Pair</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-outline bg-white px-6 pb-8 pt-6 shadow-sm">
          <CreateSwapPairStepper step={step} />

          {step === "amount" ? (
            <>
              <h1 className="mt-8 text-center text-lg font-bold text-primary-text">
                Create a Crypto Swap Pair
              </h1>

              <form onSubmit={handleContinue} className="mt-8 space-y-4">
                <CryptoSelectField
                  label="Base Cryptocurrency"
                  value={base}
                  onChange={setBase}
                  excludeCode={quote.code}
                />
                <CryptoSelectField
                  label="Quote Cryptocurrency"
                  value={quote}
                  onChange={setQuote}
                  excludeCode={base.code}
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary-text">Markup Type</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                      value={markupType}
                      onChange={(e) => setMarkupType(e.target.value as MarkupType)}
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
                  <label className="mb-1.5 block text-sm font-medium text-primary-text">
                    Base to Quote Markup Rate
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                    value={markupRateInputValue(markupType, baseToQuoteRate)}
                    onChange={(e) => setBaseToQuoteRate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-primary-text">
                    Quote to Base Markup Rate
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-primary-text outline-none focus:border-zinc-400"
                    value={markupRateInputValue(markupType, quoteToBaseRate)}
                    onChange={(e) => setQuoteToBaseRate(e.target.value)}
                  />
                </div>

                {!canContinue ? (
                  <p className="text-center text-xs text-red-500">Base and quote must be different.</p>
                ) : null}

                <button
                  type="submit"
                  disabled={!canContinue}
                  className="mt-4 w-full rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              </form>
            </>
          ) : (
            <div className="mt-8">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-outline">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border-[3px]"
                  style={{ borderColor: "var(--color-secondary-green)" }}
                >
                  <span
                    className="text-[22px] font-bold leading-none"
                    style={{ color: "var(--color-secondary-green)" }}
                  >
                    !
                  </span>
                </div>
              </div>

              <h1 className="text-center text-lg font-bold text-primary-text">Confirm Swap Pair</h1>

              <div className="mt-6 rounded-2xl bg-surface-subtle p-4">
                <CreateSwapPairConfirmCard draft={draft} />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("amount")}
                  className="flex-1 rounded-full border border-zinc-200 bg-white py-3.5 text-sm font-semibold text-primary-text transition-colors hover:bg-surface-subtle"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 rounded-full bg-primary-green py-3.5 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
