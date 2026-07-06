"use client";

import { useCallback, useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";

import { useTableFilterBarAnchor } from "@/components/ui/table-filter-bar";
import { normalizeDateRange } from "@/lib/filters/date-range";

export function useFilterBar<TField extends string>() {
  const [filterMode, setFilterMode] = useState(false);
  const [openFilter, setOpenFilter] = useState<TField | null>(null);
  const anchor = useTableFilterBarAnchor<TField>(openFilter, filterMode);

  useEffect(() => {
    if (!filterMode) setOpenFilter(null);
  }, [filterMode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenFilter(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleFilter = useCallback(
    (field: TField) => {
      setOpenFilter((current) => {
        const next = current === field ? null : field;
        anchor.syncDropdownLeft(next);
        return next;
      });
    },
    [anchor],
  );

  const openFilterBar = useCallback((onBeforeOpen?: () => void) => {
    onBeforeOpen?.();
    setFilterMode(true);
  }, []);

  const closeFilterBar = useCallback(() => {
    setOpenFilter(null);
    setFilterMode(false);
  }, []);

  return {
    filterMode,
    setFilterMode,
    openFilter,
    setOpenFilter,
    toggleFilter,
    openFilterBar,
    closeFilterBar,
    ...anchor,
  };
}

export function useSelectFilter<T extends string>(emptyValue: T) {
  const [draft, setDraft] = useState<T>(emptyValue);
  const [applied, setApplied] = useState<T | null>(null);

  const syncDraftFromApplied = useCallback(() => {
    setDraft(applied ?? emptyValue);
  }, [applied, emptyValue]);

  const applyDraft = useCallback(() => {
    setApplied(draft === emptyValue ? null : draft);
  }, [draft, emptyValue]);

  const clear = useCallback(() => {
    setDraft(emptyValue);
    setApplied(null);
  }, [emptyValue]);

  return { draft, setDraft, applied, setApplied, syncDraftFromApplied, applyDraft, clear };
}

export function useDateRangeFilter() {
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);
  const [applied, setApplied] = useState<DateRange | undefined>(undefined);

  const syncDraftFromApplied = useCallback(() => {
    setDraft(applied);
  }, [applied]);

  const applyDraft = useCallback(() => {
    setApplied(normalizeDateRange(draft));
  }, [draft]);

  const clear = useCallback(() => {
    setDraft(undefined);
    setApplied(undefined);
  }, []);

  return { draft, setDraft, applied, setApplied, syncDraftFromApplied, applyDraft, clear };
}
