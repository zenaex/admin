import { getExchangeRateRows } from "@/components/product-mgt/exchange-rate-fixtures";
import type { ExchangeRateRow, ExchangeRateSubTab } from "@/components/product-mgt/product-mgt-types";

export type ExchangeRateListResult = {
  items: ExchangeRateRow[];
  total: number;
};

/**
 * UI shell: returns fixtures. Replace with admin exchange-rate endpoints when available.
 */
export async function getExchangeRates(subTab: ExchangeRateSubTab): Promise<ExchangeRateListResult> {
  const items = getExchangeRateRows(subTab);
  return { items, total: items.length };
}
