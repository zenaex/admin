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
