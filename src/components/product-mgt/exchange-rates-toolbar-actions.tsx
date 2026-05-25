"use client";

import { Add, ArrowSwapHorizontal } from "iconsax-react";

type ExchangeRatesToolbarActionsProps = {
  onCreatePair?: () => void;
  onAddRateSheet?: () => void;
};

export function ExchangeRatesSwapToolbarActions({
  onCreatePair,
  onAddRateSheet,
}: ExchangeRatesToolbarActionsProps) {
  return (
    <>
      <button
        type="button"
        onClick={onCreatePair}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-primary-text transition-colors hover:bg-surface-subtle"
      >
        <ArrowSwapHorizontal size={16} variant="Outline" color="currentColor" />
        Create Pair
      </button>
      <button
        type="button"
        onClick={onAddRateSheet}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary-green px-3 text-xs font-semibold text-primary-text transition-opacity hover:opacity-90"
      >
        <Add size={16} variant="Outline" color="currentColor" />
        Add Rate Sheet
      </button>
    </>
  );
}
