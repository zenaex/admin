import { endOfDay, format, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";

export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "7days"
  | "30days"
  | "thisMonth"
  | "lastMonth";

export function toYmd(d: Date | undefined): string {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseYmd(s: string): Date | undefined {
  if (!s) return undefined;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

export function getPresetRange(preset: DatePreset): DateRange | undefined {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "all":
      return undefined;
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: y, to: y };
    }
    case "7days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { from: d, to: today };
    }
    case "30days": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { from: d, to: today };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start, to: today };
    }
    case "lastMonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start, to: end };
    }
  }
}

export function detectActivePreset(range: DateRange | undefined): DatePreset | "custom" {
  if (!range?.from) return "all";

  const fromStr = toYmd(range.from);
  const toStr = toYmd(range.to ?? range.from);

  const presets: DatePreset[] = ["today", "yesterday", "7days", "30days", "thisMonth", "lastMonth"];
  for (const p of presets) {
    const pr = getPresetRange(p);
    if (pr?.from && toYmd(pr.from) === fromStr && pr?.to && toYmd(pr.to) === toStr) {
      return p;
    }
  }
  return "custom";
}

export function formatDateRangeLabel(range: DateRange | undefined, fallback = "All time"): string {
  if (!range?.from) return fallback;

  const preset = detectActivePreset(range);
  switch (preset) {
    case "all":
      return fallback;
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "7days":
      return "Last 7 Days";
    case "30days":
      return "Last 30 Days";
    case "thisMonth":
      return "This Month";
    case "lastMonth":
      return "Last Month";
  }

  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const to = range.to ?? range.from;
  const fromStr = fmt(range.from);
  const toStr = fmt(to);

  return fromStr === toStr ? fromStr : `${fromStr} – ${toStr}`;
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
