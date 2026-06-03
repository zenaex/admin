import { parseNumericInput } from "@/lib/product-mgt/rate-preview";

export type ApiMarkupType = "flat" | "percentage" | "percentage_with_cap";

const CRYPTO_TICKER_TO_SLUG: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  SOL: "solana",
  USDT: "tether",
  USDC: "usd-coin",
};

export function mapUiMarkupTypeToApi(type: string): ApiMarkupType {
  const t = type.trim().toLowerCase();
  if (t === "flat") return "flat";
  if (t === "percentage") return "percentage";
  if (t.includes("capped")) return "percentage_with_cap";
  return "flat";
}

export function parseRateNumber(value: string | number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return parseNumericInput(String(value)) ?? 0;
}

export function buildMarkupConfigurePayload(
  markupType: string,
  markupRate: string | number,
  markupCap?: number,
): { markupType: ApiMarkupType; markupValue: number; markupCap?: number } {
  const apiType = mapUiMarkupTypeToApi(markupType);
  const payload: { markupType: ApiMarkupType; markupValue: number; markupCap?: number } = {
    markupType: apiType,
    markupValue: parseRateNumber(markupRate),
  };
  if (apiType === "percentage_with_cap") {
    payload.markupCap = markupCap ?? 50;
  }
  return payload;
}

/** Path/query slug for sell-crypto (e.g. `bitcoin`). */
export function resolveCryptoSlug(codeOrSlug: string, altSlug?: string): string {
  const alt = altSlug?.trim();
  if (alt) return alt.toLowerCase();
  const raw = codeOrSlug.trim();
  if (!raw) return raw;
  const upper = raw.toUpperCase();
  if (CRYPTO_TICKER_TO_SLUG[upper]) return CRYPTO_TICKER_TO_SLUG[upper];
  if (raw.includes("-") || raw.length > 6) return raw.toLowerCase();
  return raw.toLowerCase();
}

/** Swap pair path/body codes (OpenAPI examples use tickers like `BTC`). */
export function resolveSwapCryptoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function parseRmbRateNumber(value: string | number): number {
  return parseRateNumber(value);
}
