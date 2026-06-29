import { majorToKobo, parseMajorAmountInput } from "@/lib/admin-api/money";
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
  const rawRate = parseRateNumber(markupRate);
  const payload: { markupType: ApiMarkupType; markupValue: number; markupCap?: number } = {
    markupType: apiType,
    markupValue: apiType === "flat" ? majorToKobo(rawRate) : rawRate,
  };
  if (apiType === "percentage_with_cap") {
    payload.markupCap =
      markupCap !== undefined ? majorToKobo(markupCap) : majorToKobo(parseMajorAmountInput("50"));
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

/** Resolve API slug (e.g. `bitcoin`) or ticker to display ticker (e.g. `BTC`). */
export function slugToCryptoTicker(slugOrCode: string): string {
  const raw = slugOrCode.trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (CRYPTO_TICKER_TO_SLUG[upper]) return upper;
  const lower = raw.toLowerCase();
  for (const [ticker, slug] of Object.entries(CRYPTO_TICKER_TO_SLUG)) {
    if (slug === lower) return ticker;
  }
  if (/^[A-Z0-9]{2,8}$/.test(upper)) return upper;
  return "";
}

export function parseRmbRate(val: string): number {
  const clean = val.trim();
  if (clean.includes("/")) {
    const parts = clean.split("/");
    const after = parts[parts.length - 1];
    const n = parseFloat(after.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  const n = parseFloat(clean.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function parseRmbRateNumber(value: string | number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return parseRmbRate(String(value));
}

