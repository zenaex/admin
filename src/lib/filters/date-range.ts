import { endOfDay, format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

export function formatDateRangeLabel(range: DateRange | undefined, fallback = "All time"): string {
  if (!range?.from) return fallback;
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const to = range.to ?? range.from;
  return `${fmt(range.from)} – ${fmt(to)}`;
}

/** Ensure a range has inclusive start/end-of-day boundaries. Single-day selection uses the same day for both ends. */
export function normalizeDateRange(range: DateRange | undefined): DateRange | undefined {
  if (!range?.from) return undefined;
  return {
    from: startOfDay(range.from),
    to: endOfDay(range.to ?? range.from),
  };
}

/** API query param for range start (`fromDate` / `dateFrom`). */
export function toApiDateFrom(range: DateRange | undefined): string | undefined {
  if (!range?.from) return undefined;
  return format(startOfDay(range.from), "yyyy-MM-dd");
}

/** API query param for range end (`toDate` / `dateTo`). */
export function toApiDateTo(range: DateRange | undefined): string | undefined {
  if (!range?.from) return undefined;
  const end = range.to ?? range.from;
  return format(endOfDay(end), "yyyy-MM-dd");
}

export function parseLooseDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime())) return direct;

  const datePart = trimmed.split("|")[0]?.trim();
  if (datePart) {
    const fromDisplay = new Date(datePart);
    if (!Number.isNaN(fromDisplay.getTime())) return fromDisplay;
  }

  return null;
}

export function firstParsedDate(...candidates: unknown[]): Date | null {
  for (const candidate of candidates) {
    const parsed = parseLooseDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

/** Client-side inclusive date-range check. Rows without a parseable date are kept visible. */
export function matchesDateRangeFilter(range: DateRange | undefined, ...candidates: unknown[]): boolean {
  const normalized = normalizeDateRange(range);
  if (!normalized?.from) return true;

  const itemDate = firstParsedDate(...candidates);
  if (!itemDate) return true;

  return itemDate >= normalized.from! && itemDate <= normalized.to!;
}

export function matchesDateRangeFromRecord(
  range: DateRange | undefined,
  raw: Record<string, unknown> | undefined,
  fieldKeys: string[],
  ...fallbacks: unknown[]
): boolean {
  const candidates = [...fieldKeys.map((key) => raw?.[key]), ...fallbacks];
  return matchesDateRangeFilter(range, ...candidates);
}
