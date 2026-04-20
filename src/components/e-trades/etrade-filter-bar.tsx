"use client";

import { ArrowDown2, CloseCircle } from "iconsax-react";

type EtradeFilterBarProps = {
  etradeType: string;
  etradeTypeOptions: string[];
  onEtradeTypeChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
};

export function EtradeFilterBar({
  etradeType,
  etradeTypeOptions,
  onEtradeTypeChange,
  onApply,
  onClear,
}: EtradeFilterBarProps) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 sm:min-w-[240px] sm:flex-initial">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex shrink-0 text-zinc-500 transition-colors hover:text-zinc-700"
          aria-label="Remove filter"
        >
          <CloseCircle size={18} variant="Outline" color="currentColor" />
        </button>
        <span className="hidden shrink-0 text-sm text-zinc-500 sm:inline">Etrade Type</span>
        <span className="hidden text-zinc-300 sm:inline">|</span>
        <div className="relative min-w-0 flex-1">
          <select
            value={etradeType}
            onChange={(e) => onEtradeTypeChange(e.target.value)}
            className="h-8 w-full cursor-pointer appearance-none bg-transparent pr-7 text-sm font-medium text-primary-text outline-none"
            aria-label="Etrade type"
          >
            {etradeTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-zinc-500">
            <ArrowDown2 size={14} variant="Outline" color="currentColor" />
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        className="rounded-full bg-primary-green px-6 py-2 text-sm font-semibold text-primary-text transition-opacity hover:opacity-90"
      >
        Apply
      </button>

      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy transition-colors hover:text-secondary-green"
      >
        <CloseCircle size={16} variant="Outline" color="currentColor" />
        Clear Filter
      </button>
    </div>
  );
}
