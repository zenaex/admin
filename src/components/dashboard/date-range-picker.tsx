"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ArrowDown2, ArrowLeft2, ArrowRight2, Calendar } from "iconsax-react";
import "react-day-picker/dist/style.css";

type Props = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
};

export function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
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

  const label =
    value?.from && value?.to
      ? `${format(value.from, "MMM d, yyyy")} – ${format(value.to, "MMM d, yyyy")}`
      : value?.from
      ? `${format(value.from, "MMM d, yyyy")} – ...`
      : "Select date range";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-white px-3.5 text-sm font-medium text-primary-text transition-colors hover:bg-surface-subtle"
      >
        <Calendar size={16} variant="Outline" color="currentColor" />
        {label}
        <ArrowDown2
          size={14}
          variant="Outline"
          color="currentColor"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-outline bg-white shadow-xl">
          <DayPicker
            mode="range"
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range?.to) setOpen(false);
            }}
            numberOfMonths={2}
            components={{
              PreviousMonthButton: (props) => (
                <button {...props} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-surface-subtle transition-colors">
                  <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
                </button>
              ),
              NextMonthButton: (props) => (
                <button {...props} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-surface-subtle transition-colors">
                  <ArrowRight2 size={14} variant="Outline" color="currentColor" />
                </button>
              ),
            }}
            styles={{
              months: { display: "flex", gap: "1rem", padding: "1rem" },
              month_caption: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" },
              caption_label: { fontSize: "0.875rem", fontWeight: 600, color: "#0A0A0A" },
              nav: { display: "flex", alignItems: "center", gap: "0.25rem" },
              weekdays: { marginBottom: "0.25rem" },
              weekday: { fontSize: "0.75rem", color: "#9E9E9E", fontWeight: 500, width: "2.25rem", textAlign: "center", padding: "0.25rem 0" },
              day: { width: "2.25rem", height: "2.25rem", fontSize: "0.8125rem", borderRadius: "9999px" },
              day_button: { width: "2.25rem", height: "2.25rem", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center" },
              today: { fontWeight: 700, color: "#013220" },
            }}
            classNames={{
              selected: "bg-primary-green text-primary-text rounded-full",
              range_start: "bg-secondary-green text-white rounded-full",
              range_end: "bg-secondary-green text-white rounded-full",
              range_middle: "bg-primary-green/20 rounded-none",
              day_button: "hover:bg-surface-subtle rounded-full transition-colors",
            }}
          />

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-outline px-4 py-3">
            <button
              type="button"
              onClick={() => { onChange(undefined); setOpen(false); }}
              className="rounded-full border border-outline px-4 py-1.5 text-xs font-medium text-zinc-500 hover:bg-surface-subtle transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
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
