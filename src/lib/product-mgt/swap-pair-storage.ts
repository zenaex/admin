import type { ExchangeRateRow, SwapPairMeta } from "@/components/product-mgt/product-mgt-types";
import {
  formatSwapPairOurCommission,
  formatUpdatedDate,
  type SwapPairFormValues,
} from "@/lib/product-mgt/rate-preview";

const STORAGE_KEY = "product-mgt-extra-swap-pairs";

export type CreateSwapPairDraft = SwapPairFormValues & {
  baseCode: string;
  baseName: string;
  quoteCode: string;
  quoteName: string;
};

export function buildSwapPairRow(draft: CreateSwapPairDraft): ExchangeRateRow {
  const pair: SwapPairMeta = {
    baseCode: draft.baseCode,
    baseName: draft.baseName,
    quoteCode: draft.quoteCode,
    quoteName: draft.quoteName,
  };
  const id = `rate-swap-${pair.baseCode.toLowerCase()}-${pair.quoteCode.toLowerCase()}-${Date.now()}`;

  return {
    id,
    swapPair: pair,
    currencyCode: `${pair.baseCode} ⇆ ${pair.quoteCode}`,
    currencyName: `${pair.baseName} & ${pair.quoteName}`,
    commissionType: draft.markupType,
    ourCommission: formatSwapPairOurCommission({
      markupType: draft.markupType,
      baseToQuoteRate: draft.baseToQuoteRate,
      quoteToBaseRate: draft.quoteToBaseRate,
    }),
    baseRate: "—",
    finalRate: "—",
    dateUpdated: formatUpdatedDate(),
  };
}

export function readExtraSwapPairRows(): ExchangeRateRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExchangeRateRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendExtraSwapPairRow(row: ExchangeRateRow): void {
  if (typeof window === "undefined") return;
  const existing = readExtraSwapPairRows();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, row]));
}

export function mergeSwapPairRows(
  fixtureRows: ExchangeRateRow[],
  extraRows: ExchangeRateRow[],
): ExchangeRateRow[] {
  const ids = new Set(fixtureRows.map((r) => r.id));
  const merged = [...fixtureRows];
  for (const row of extraRows) {
    if (!ids.has(row.id)) {
      merged.push(row);
      ids.add(row.id);
    }
  }
  return merged;
}
