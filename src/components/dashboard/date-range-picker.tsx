"use client";

import { useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { ArrowDown2, Calendar } from "iconsax-react";

import { TableFilterDatePanel } from "@/components/ui/table-filter-bar";
import { formatDateRangeLabel } from "@/lib/filters/date-range";

type Props = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(value);
  const ref = useRef<HTMLDivElement>(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setDraftRange(value);
    }
  }, [open, value]);

  const label = formatDateRangeLabel(value, "Select date range");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-medium text-primary-text transition-colors hover:bg-surface-subtle"
      >
        <Calendar size={16} variant="Outline" color="currentColor" />
        <span>{label}</span>
        <ArrowDown2
          size={14}
          variant="Outline"
          color="currentColor"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 rounded-2xl border border-outline bg-white p-3 shadow-xl">
          <TableFilterDatePanel value={draftRange} onChange={setDraftRange} />

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-outline px-2 pt-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setDraftRange(undefined);
                onChange(undefined);
                setOpen(false);
              }}
              className="rounded-full border border-outline px-4 py-1.5 text-xs font-medium text-zinc-500 hover:bg-surface-subtle transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(draftRange);
                setOpen(false);
              }}
              className="rounded-full bg-primary-green px-4 py-1.5 text-xs font-semibold text-primary-text hover:opacity-90 transition-opacity"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
