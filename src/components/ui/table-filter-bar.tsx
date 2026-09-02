"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { X, ChevronDown } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { ArrowLeft2, ArrowRight2 } from "iconsax-react";

import {
  detectActivePreset,
  formatDateRangeLabel,
  getPresetRange,
  parseYmd,
  toYmd,
  type DatePreset,
} from "@/lib/filters/date-range";

export { formatDateRangeLabel };

export function TableFilterCalendar({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}) {
  const [viewDate, setViewDate] = useState(() => value?.from ?? new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const numDays = lastDayOfMonth.getDate();

  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (dayNum: number) => {
    const clicked = new Date(year, month, dayNum);

    if (!value?.from || (value.from && value.to)) {
      onChange({ from: clicked, to: undefined });
    } else if (value.from && !value.to) {
      if (clicked < value.from) {
        onChange({ from: clicked, to: undefined });
      } else {
        onChange({ from: value.from, to: clicked });
      }
    }
  };

  const isSelected = (dayNum: number) => {
    if (!value?.from) return false;
    const current = new Date(year, month, dayNum);
    const fromYmd = toYmd(value.from);
    const toYmdStr = toYmd(value.to ?? value.from);
    const currYmd = toYmd(current);

    return currYmd === fromYmd || currYmd === toYmdStr;
  };

  const isInRange = (dayNum: number) => {
    if (!value?.from || !value?.to) return false;
    const current = new Date(year, month, dayNum);
    const fromTime = new Date(value.from.getFullYear(), value.from.getMonth(), value.from.getDate()).getTime();
    const toTime = new Date(value.to.getFullYear(), value.to.getMonth(), value.to.getDate()).getTime();
    const currTime = current.getTime();

    return currTime > fromTime && currTime < toTime;
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === dayNum
    );
  };

  return (
    <div className="w-full select-none rounded-xl bg-white p-1">
      {/* Month Navigation */}
      <div className="mb-2 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
          aria-label="Previous month"
        >
          <ArrowLeft2 size={14} variant="Outline" color="currentColor" />
        </button>
        <span className="text-xs font-bold text-primary-text">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors"
          aria-label="Next month"
        >
          <ArrowRight2 size={14} variant="Outline" color="currentColor" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mb-1 grid grid-cols-7 text-center">
        {dayNames.map((d) => (
          <span key={d} className="py-1 text-[10px] font-semibold text-zinc-400">
            {d}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: numDays }, (_, i) => i + 1).map((dayNum) => {
          const selected = isSelected(dayNum);
          const inRange = isInRange(dayNum);
          const today = isToday(dayNum);

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleDayClick(dayNum)}
              className={`relative flex h-7 w-7 items-center justify-center rounded-full mx-auto font-medium transition-all ${
                selected
                  ? "bg-[#013220] text-white font-bold shadow-xs"
                  : inRange
                  ? "bg-[#BCEB0F]/30 text-primary-text rounded-none"
                  : today
                  ? "border border-[#013220] text-[#013220] font-bold"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Muted label color used across Transactions-style filter panels */
export const TABLE_FILTER_MUTED = "#667085";

export function useTableFilterBarAnchor<T extends string>(
  openField: T | null,
  filterMode: boolean,
) {
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const filterScrollRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  const registerPillRef = useCallback((id: T) => {
    return (el: HTMLButtonElement | null) => {
      if (el) pillRefs.current[id] = el;
      else delete pillRefs.current[id];
    };
  }, []);

  const [dropdownLeft, setDropdownLeft] = useState(0);

  const syncDropdownLeft = useCallback((nextOpen: T | null) => {
    const bar = filterBarRef.current;
    if (!bar || !nextOpen) return;
    const target = pillRefs.current[nextOpen];
    if (!target) return;
    const barRect = bar.getBoundingClientRect();
    const pillRect = target.getBoundingClientRect();
    setDropdownLeft(Math.max(0, pillRect.left - barRect.left));
  }, []);

  useEffect(() => {
    if (!filterMode) return;
    syncDropdownLeft(openField);
  }, [filterMode, openField, syncDropdownLeft]);

  useEffect(() => {
    if (!filterMode || !openField) return;
    const onResize = () => syncDropdownLeft(openField);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [filterMode, openField, syncDropdownLeft]);

  return {
    filterBarRef,
    filterScrollRef,
    dropdownLeft,
    registerPillRef,
    syncDropdownLeft,
  };
}

type TableFilterModeBarProps = {
  filterBarRef: RefObject<HTMLDivElement | null>;
  filterScrollRef: RefObject<HTMLDivElement | null>;
  showBackdrop: boolean;
  onBackdropClick: () => void;
  onPillsScroll: () => void;
  pills: ReactNode;
  /** Absolute-positioned dropdown panels (siblings after scroll strip, like Transactions) */
  dropdownLayer: ReactNode;
  actions: ReactNode;
  pillsTrailing?: ReactNode;
  /** Extra root classes (e.g. `mt-0 border-t border-zinc-100 pt-4` when nested in a card) */
  barClassName?: string;
};

export function TableFilterModeBar({
  filterBarRef,
  filterScrollRef,
  showBackdrop,
  onBackdropClick,
  onPillsScroll,
  pills,
  dropdownLayer,
  actions,
  pillsTrailing,
  barClassName,
}: TableFilterModeBarProps) {
  return (
    <div
      ref={filterBarRef}
      className={`relative mt-6 flex h-14.5 items-center gap-2 overflow-visible rounded-xl bg-white px-3 sm:px-4 ${barClassName ?? ""}`}
    >
      {showBackdrop ? (
        <div className="fixed inset-0 z-40" onClick={onBackdropClick} aria-hidden />
      ) : null}
      <div
        ref={filterScrollRef}
        className="relative z-50 min-w-0 flex-1 overflow-x-auto"
        onScroll={onPillsScroll}
      >
        <div className="flex min-w-0 items-center gap-2">
          {pills}
          {pillsTrailing}
        </div>
      </div>
      {dropdownLayer}
      <div className="z-50 ml-auto flex shrink-0 items-center gap-3">{actions}</div>
    </div>
  );
}

type TableFilterPillProps = {
  label: string;
  summary: string;
  onClick: () => void;
  pillRef?: (el: HTMLButtonElement | null) => void;
};

export function TableFilterPill({ label, summary, onClick, pillRef }: TableFilterPillProps) {
  return (
    <button
      ref={pillRef}
      type="button"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E8EBEE] bg-[#F7F7F7] px-3 py-2 text-[12px] text-primary-text"
      onClick={onClick}
    >
      <X size={14} />
      <span className="text-[12px]" style={{ color: TABLE_FILTER_MUTED }}>
        {label}
      </span>
      <span className="max-w-[200px] truncate text-[12px]" style={{ color: TABLE_FILTER_MUTED }}>
        {summary}
      </span>
      <ChevronDown size={14} className="ml-0.5 shrink-0" />
    </button>
  );
}

type TableFilterDropdownCardProps = {
  left: number;
  widthClass?: string;
  children: ReactNode;
};

export function TableFilterDropdownCard({
  left,
  widthClass = "w-[220px]",
  children,
}: TableFilterDropdownCardProps) {
  return (
    <div
      className={`absolute top-full z-[60] mt-2 ${widthClass} rounded-[12px] border border-zinc-200 bg-white p-2 shadow-lg`}
      style={{ left }}
    >
      {children}
    </div>
  );
}

export function TableFilterPanelTitle() {
  return (
    <p className="text-[12px] font-medium" style={{ color: TABLE_FILTER_MUTED }}>
      Filter
    </p>
  );
}

export function TableFilterOptionsList({
  options,
  onSelect,
}: {
  options: readonly string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-[10px]">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className="flex w-full items-center px-2.5 py-2 text-left text-[14px] text-primary-text hover:bg-zinc-50"
          onClick={() => onSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export type TableFilterSelectOption<V extends string = string> = {
  value: V;
  label: string;
};

export function TableFilterSelectOptions<V extends string>({
  options,
  selectedValue,
  onSelect,
}: {
  options: readonly TableFilterSelectOption<V>[];
  selectedValue: V;
  onSelect: (value: V) => void;
}) {
  return (
    <div className="mt-2 overflow-hidden rounded-[10px]">
      {options.map((opt) => (
        <button
          key={opt.value || "__all__"}
          type="button"
          className={`flex w-full items-center px-2.5 py-2 text-left text-[14px] hover:bg-zinc-50 ${
            selectedValue === opt.value ? "bg-zinc-50 font-medium text-primary-text" : "text-primary-text"
          }`}
          onClick={() => onSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function TableFilterDatePanel({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}) {
  const activePreset = detectActivePreset(value);

  const fromStr = value?.from ? toYmd(value.from) : "";
  const toStr = value?.to ? toYmd(value.to) : "";

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fromDate = parseYmd(e.target.value);
    onChange({ from: fromDate, to: value?.to });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toDate = parseYmd(e.target.value);
    onChange({ from: value?.from, to: toDate });
  };

  const presets: { id: DatePreset; label: string }[] = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "7days", label: "Last 7 Days" },
    { id: "30days", label: "Last 30 Days" },
    { id: "thisMonth", label: "This Month" },
    { id: "lastMonth", label: "Last Month" },
  ];

  return (
    <div className="w-[280px] sm:w-[310px] p-2 select-none">
      <div className="mb-2 flex items-center justify-between">
        <TableFilterPanelTitle />
        {value?.from ? (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[11px] font-medium text-red-600 hover:underline"
          >
            Clear Date
          </button>
        ) : null}
      </div>

      {/* Quick Presets Bar */}
      <div className="mb-3 flex flex-wrap gap-1.5 border-b border-zinc-100 pb-3">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(getPresetRange(p.id))}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-[#013220] text-white shadow-2xs font-semibold"
                  : "border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Direct Date Inputs */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">From</label>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-primary-text outline-none focus:border-zinc-400 font-medium"
            value={fromStr}
            onChange={handleFromChange}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] font-medium uppercase text-zinc-400">To</label>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-primary-text outline-none focus:border-zinc-400 font-medium"
            value={toStr}
            onChange={handleToChange}
          />
        </div>
      </div>

      {/* Custom Calendar Picker */}
      <div className="border-t border-zinc-100 pt-2">
        <TableFilterCalendar value={value} onChange={onChange} />
      </div>
    </div>
  );
}

export function TableFilterApplyClear({
  onApply,
  onClear,
}: {
  onApply: () => void;
  onClear: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-full bg-[#BCEB0F] px-5 text-[12px] font-semibold text-primary-text"
        onClick={onApply}
      >
        Apply
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 text-[12px]"
        style={{ color: TABLE_FILTER_MUTED }}
        onClick={onClear}
      >
        <X size={14} />
        Clear Filter
      </button>
    </>
  );
}

type TableFilterTrailingIconButtonProps = {
  ariaLabel: string;
  children: ReactNode;
  onClick: () => void;
};

export function TableFilterTrailingIconButton({
  ariaLabel,
  children,
  onClick,
}: TableFilterTrailingIconButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#E8EBEE] bg-[#F7F7F7] px-3 py-2 text-[12px]"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
